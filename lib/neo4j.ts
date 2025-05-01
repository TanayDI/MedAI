import neo4j, { type Driver, type Session, type Record as Neo4jRecord } from "neo4j-driver"
import type { PrescriptionResult } from "./types"

let driver: Driver | null = null

/**
 * Initialize the Neo4j connection
 */
export async function initNeo4j() {
  try {
    // In production, these would come from environment variables
    const uri = process.env.NEO4J_URI || "neo4j://localhost:7687"
    const user = process.env.NEO4J_USER || "neo4j"
    const password = process.env.NEO4J_PASSWORD || "password"

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password))

    // Verify connection
    await driver.verifyConnectivity()
    console.log("Connected to Neo4j database")

    // Initialize schema constraints
    await initializeSchema()

    return driver
  } catch (error) {
    console.error("Failed to connect to Neo4j:", error)
    // Fallback to mock implementation if Neo4j is not available
    console.log("Using mock Neo4j implementation")
    return null
  }
}

/**
 * Initialize schema constraints for the graph
 */
async function initializeSchema() {
  const session = getSession()
  try {
    // Create constraints to ensure uniqueness
    await session.run(`
      CREATE CONSTRAINT prescription_id_unique IF NOT EXISTS
      FOR (p:Prescription) REQUIRE p.id IS UNIQUE
    `)
    await session.run(`
      CREATE CONSTRAINT patient_name_age_gender_unique IF NOT EXISTS
      FOR (p:Patient) REQUIRE (p.name, p.age, p.gender) IS NODE KEY
    `)
    await session.run(`
      CREATE CONSTRAINT medication_name_unique IF NOT EXISTS
      FOR (m:Medication) REQUIRE m.name IS UNIQUE
    `)
  } catch (error) {
    console.error("Error initializing schema:", error)
  } finally {
    await session.close()
  }
}

/**
 * Get a Neo4j session
 */
export function getSession(): Session {
  if (!driver) {
    throw new Error("Neo4j driver not initialized")
  }
  return driver.session()
}

/**
 * Close the Neo4j connection
 */
export async function closeNeo4j() {
  if (driver) {
    await driver.close()
    driver = null
  }
}

/**
 * Store prescription analysis in Neo4j
 */
export async function storePrescriptionInGraph(
  result: PrescriptionResult,
  patientInfo: any,
  blockchainHash: string,
): Promise<void> {
  // Use mock implementation if Neo4j is not available
  if (!driver) {
    console.log("Using mock Neo4j storage")
    mockGraphData[blockchainHash] = { result, patientInfo }
    return
  }

  const session = getSession()
  try {
    const medications = extractMedicationsFromPrescription(result.originalPrescription)

    // Create transaction
    const tx = session.beginTransaction()

    try {
      // Create patient node if not exists
      await tx.run(
        `
        MERGE (p:Patient {name: $name, age: $age, gender: $gender})
        RETURN p
      `,
        {
          name: patientInfo.name,
          age: Number.parseInt(patientInfo.age),
          gender: patientInfo.gender,
        },
      )

      // Create prescription node
      await tx.run(
        `
        CREATE (rx:Prescription {
          id: $id,
          blockchainHash: $blockchainHash,
          originalPrescription: $originalPrescription,
          status: $status,
          timestamp: $timestamp,
          lastUpdated: $lastUpdated
        })
        WITH rx
        MATCH (p:Patient {name: $name, age: $age, gender: $gender})
        CREATE (p)-[:RECEIVED]->(rx)
        RETURN rx
      `,
        {
          id: result.id,
          blockchainHash: blockchainHash,
          originalPrescription: result.originalPrescription,
          status: result.status,
          timestamp: result.timestamp,
          lastUpdated: result.lastUpdated,
          name: patientInfo.name,
          age: Number.parseInt(patientInfo.age),
          gender: patientInfo.gender,
        },
      )

      // Create medication nodes and relationships
      for (const med of medications) {
        await tx.run(
          `
          MERGE (m:Medication {name: $medName})
          WITH m
          MATCH (rx:Prescription {id: $rxId})
          CREATE (rx)-[:INCLUDES]->(m)
        `,
          {
            medName: med,
            rxId: result.id,
          },
        )
      }

      // If there are issues, store them
      if (result.issues && result.issues.length > 0) {
        for (const issue of result.issues) {
          await tx.run(
            `
            MATCH (rx:Prescription {id: $rxId})
            CREATE (i:Issue {
              title: $title,
              description: $description,
              severity: $severity
            })
            CREATE (rx)-[:HAS_ISSUE]->(i)
          `,
            {
              rxId: result.id,
              title: issue.title,
              description: issue.description,
              severity: issue.severity,
            },
          )
        }
      }

      // If there are suggestions, store them
      if (result.suggestions && result.suggestions.length > 0) {
        for (const suggestion of result.suggestions) {
          await tx.run(
            `
            MATCH (rx:Prescription {id: $rxId})
            CREATE (s:Suggestion {
              title: $title,
              description: $description
            })
            CREATE (rx)-[:HAS_SUGGESTION]->(s)
          `,
            {
              rxId: result.id,
              title: suggestion.title,
              description: suggestion.description,
            },
          )
        }
      }

      // Commit the transaction
      await tx.commit()
      console.log("Prescription stored in Neo4j graph")
    } catch (error) {
      // Rollback in case of error
      await tx.rollback()
      console.error("Error storing prescription in Neo4j:", error)
      throw error
    }
  } finally {
    await session.close()
  }
}

/**
 * Get prescription history for a patient from Neo4j
 */
export async function getPatientPrescriptionHistory(patientInfo: any): Promise<PrescriptionResult[]> {
  // Use mock implementation if Neo4j is not available
  if (!driver) {
    console.log("Using mock Neo4j retrieval")
    return Object.values(mockGraphData).map((data) => data.result)
  }

  const session = getSession()
  try {
    const result = await session.run(
      `
      MATCH (p:Patient {name: $name})-[:RECEIVED]->(rx:Prescription)
      OPTIONAL MATCH (rx)-[:HAS_ISSUE]->(i:Issue)
      OPTIONAL MATCH (rx)-[:HAS_SUGGESTION]->(s:Suggestion)
      OPTIONAL MATCH (rx)-[:INCLUDES]->(m:Medication)
      RETURN rx, 
             collect(distinct i) as issues, 
             collect(distinct s) as suggestions,
             collect(distinct m.name) as medications
      ORDER BY rx.timestamp DESC
    `,
      {
        name: patientInfo.name,
      },
    )

    return result.records.map((record: Neo4jRecord) => {
      const rx = record.get("rx").properties
      const issues = record.get("issues").map((issue: any) => issue.properties)
      const suggestions = record.get("suggestions").map((suggestion: any) => suggestion.properties)
      const medications = record.get("medications")

      return {
        id: rx.id,
        originalPrescription: rx.originalPrescription,
        status: rx.status,
        issues: issues.length > 0 ? issues : undefined,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        dataSources: {
          vectorDbEntries: 0,
          searchQueries: 0,
        },
        timestamp: rx.timestamp,
        blockchainStatus: "Recorded",
        lastUpdated: rx.lastUpdated,
        medications,
      } as PrescriptionResult
    })
  } finally {
    await session.close()
  }
}

/**
 * Get prescription by blockchain hash
 */
export async function getPrescriptionByHash(blockchainHash: string): Promise<PrescriptionResult | null> {
  // Use mock implementation if Neo4j is not available
  if (!driver) {
    console.log("Using mock Neo4j retrieval by hash")
    return mockGraphData[blockchainHash]?.result || null
  }

  const session = getSession()
  try {
    const result = await session.run(
      `
      MATCH (rx:Prescription {blockchainHash: $blockchainHash})
      OPTIONAL MATCH (rx)-[:HAS_ISSUE]->(i:Issue)
      OPTIONAL MATCH (rx)-[:HAS_SUGGESTION]->(s:Suggestion)
      OPTIONAL MATCH (rx)-[:INCLUDES]->(m:Medication)
      RETURN rx, 
             collect(distinct i) as issues, 
             collect(distinct s) as suggestions,
             collect(distinct m.name) as medications
    `,
      {
        blockchainHash,
      },
    )

    if (result.records.length === 0) {
      return null
    }

    const record = result.records[0]
    const rx = record.get("rx").properties
    const issues = record.get("issues").map((issue: any) => issue.properties)
    const suggestions = record.get("suggestions").map((suggestion: any) => suggestion.properties)
    const medications = record.get("medications")

    return {
      id: rx.id,
      originalPrescription: rx.originalPrescription,
      status: rx.status,
      issues: issues.length > 0 ? issues : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      dataSources: {
        vectorDbEntries: 0,
        searchQueries: 0,
      },
      timestamp: rx.timestamp,
      blockchainStatus: "Recorded",
      lastUpdated: rx.lastUpdated,
      medications,
    } as PrescriptionResult
  } finally {
    await session.close()
  }
}

/**
 * Update prescription in Neo4j
 */
export async function updatePrescriptionInGraph(result: PrescriptionResult, blockchainHash: string): Promise<void> {
  // Use mock implementation if Neo4j is not available
  if (!driver) {
    console.log("Using mock Neo4j update")
    if (mockGraphData[blockchainHash]) {
      mockGraphData[blockchainHash].result = result
    }
    return
  }

  const session = getSession()
  try {
    await session.run(
      `
      MATCH (rx:Prescription {id: $id})
      SET rx.status = $status,
          rx.lastUpdated = $lastUpdated,
          rx.blockchainHash = $blockchainHash
      RETURN rx
    `,
      {
        id: result.id,
        status: result.status,
        lastUpdated: result.lastUpdated,
        blockchainHash,
      },
    )

    console.log("Prescription updated in Neo4j graph")
  } finally {
    await session.close()
  }
}

/**
 * Extract medications from prescription text
 */
function extractMedicationsFromPrescription(prescription: string): string[] {
  // Basic extraction logic - split by commas or new lines
  const medications = prescription
    .split(/[,\n]/)
    .map((med) => {
      // Extract just the medication name (typically the first word or two)
      const match = med.trim().match(/^([A-Za-z\s]+)/)
      return match ? match[0].trim() : med.trim()
    })
    .filter((med) => med.length > 0)

  return medications
}

// Mock implementation for when Neo4j is not available
const mockGraphData: Record<string, { result: PrescriptionResult; patientInfo: any }> = {}
