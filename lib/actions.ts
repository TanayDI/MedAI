"use server"

import { z } from "zod"
import type { PrescriptionResult } from "./types"
import { storeOnBlockchain, updateOnBlockchain, getPrescriptionFromHash } from "./blockchain"
import { analyzePrescriptionWithRAG } from "./ai"
import { getPatientPrescriptionHistory } from "./neo4j"

// Define the schema for the prescription analysis result
const prescriptionResultSchema = z.object({
  status: z.enum(["valid", "warning", "invalid"]),
  issues: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        severity: z.enum(["low", "medium", "high"]),
      }),
    )
    .optional(),
  suggestions: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    )
    .optional(),
  dataSources: z.object({
    vectorDbEntries: z.number(),
    searchQueries: z.number(),
  }),
})

// Mock database for storing results (in a real app, this would be a database)
const resultsStore: Record<string, PrescriptionResult> = {}

export async function analyzePrescription(formData: any): Promise<void> {
  try {
    // Generate a unique ID for this analysis
    const analysisId = `rx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Get patient prescription history from Neo4j
    const patientHistory = await getPatientPrescriptionHistory({
      name: formData.name,
      age: formData.age,
      gender: formData.gender,
    })

    // Prepare the prompt for Gemini AI analysis
    const prompt = `
      Analyze this prescription considering:
      - Patient Name: ${formData.name}
      - Age: ${formData.age}
      - Gender: ${formData.gender}
      - Current Medications: ${formData.medications}
      - Symptoms: ${formData.symptoms}
      - New Prescription: ${formData.prescription}

      Patient History: ${
        patientHistory.length > 0
          ? `This patient has ${patientHistory.length} previous prescription records.`
          : "No previous prescriptions recorded."
      }

      ${
        patientHistory.length > 0
          ? `Previous prescriptions: 
          ${patientHistory
            .map(
              (p, i) =>
                `Record ${i + 1} (${new Date(p.timestamp).toLocaleDateString()}): 
            ${p.originalPrescription}
            Status: ${p.status}
            ${p.issues ? `Issues: ${p.issues.map((issue) => issue.title).join(", ")}` : "No issues identified."}`,
            )
            .join("\n\n")}`
          : ""
      }

      Provide a comprehensive analysis including:
      1. Drug interactions with current medications
      2. Age-appropriate dosing
      3. Contraindications based on symptoms
      4. Overall safety assessment
      5. Compare with previous prescriptions to identify potential issues
    `

    // Use Gemini AI to analyze the prescription
    const analysis = await analyzePrescriptionWithRAG(formData.prescription, {
      name: formData.name,
      age: formData.age,
      gender: formData.gender,
      medications: formData.medications,
      symptoms: formData.symptoms,
      patientHistory,
      prompt: prompt,
    })

    // Store the result with the original prescription
    const result: PrescriptionResult = {
      id: analysisId,
      originalPrescription: formData.prescription,
      ...analysis,
      timestamp: new Date().toISOString(),
      blockchainStatus: "Pending",
      lastUpdated: new Date().toISOString(),
    }

    // Store in our mock database
    resultsStore[analysisId] = result

    // Store on blockchain and Neo4j graph database
    await storeOnBlockchain(result, {
      name: formData.name,
      age: formData.age,
      gender: formData.gender,
      medications: formData.medications,
      symptoms: formData.symptoms,
    })

    // Update the blockchain status
    resultsStore[analysisId].blockchainStatus = "Recorded"
  } catch (error) {
    console.error("Error analyzing prescription:", error)
    throw new Error("Failed to analyze prescription")
  }
}

export async function getPrescriptionResults(): Promise<PrescriptionResult> {
  // In a real app, this would fetch from a database based on user ID or session
  // For demo purposes, we'll return the last result
  const keys = Object.keys(resultsStore)
  if (keys.length === 0) {
    // If no results, return a mock result
    return {
      id: "rx-mock-123456",
      originalPrescription: "Lisinopril 10mg once daily, Metformin 500mg twice daily",
      status: "warning",
      issues: [
        {
          title: "Potential Drug Interaction",
          description: "Lisinopril and Metformin may interact, causing hypoglycemia in some patients.",
          severity: "medium",
        },
      ],
      suggestions: [
        {
          title: "Monitor Blood Sugar",
          description: "Regularly monitor blood sugar levels when taking these medications together.",
        },
        {
          title: "Consider Alternative",
          description: "If hypoglycemia occurs, consider alternative blood pressure medications.",
        },
      ],
      dataSources: {
        vectorDbEntries: 1245,
        searchQueries: 3,
      },
      timestamp: new Date().toISOString(),
      blockchainStatus: "Recorded",
      lastUpdated: new Date().toISOString(),
    }
  }

  return resultsStore[keys[keys.length - 1]]
}

export async function updateBlockchainRecord(id: string): Promise<void> {
  try {
    if (!resultsStore[id]) {
      throw new Error("Record not found")
    }

    // Update on blockchain and Neo4j
    await updateOnBlockchain(id, resultsStore[id])

    // Update the last updated timestamp
    resultsStore[id].lastUpdated = new Date().toISOString()
    resultsStore[id].blockchainStatus = "Updated"
  } catch (error) {
    console.error("Error updating blockchain record:", error)
    throw new Error("Failed to update blockchain record")
  }
}

export async function searchPrescriptionByHash(hash: string): Promise<PrescriptionResult | null> {
  try {
    return await getPrescriptionFromHash(hash)
  } catch (error) {
    console.error("Error searching for prescription by hash:", error)
    return null
  }
}

export async function getPatientHistory(patientInfo: any): Promise<PrescriptionResult[]> {
  try {
    return await getPatientPrescriptionHistory(patientInfo)
  } catch (error) {
    console.error("Error retrieving patient history:", error)
    return []
  }
}
