export interface PrescriptionResult {
  id: string
  originalPrescription: string
  status: "valid" | "warning" | "invalid"
  issues?: {
    title: string
    description: string
    severity: "low" | "medium" | "high"
  }[]
  suggestions?: {
    title: string
    description: string
  }[]
  dataSources: {
    vectorDbEntries: number
    searchQueries: number
  }
  timestamp: string
  blockchainStatus: string
  lastUpdated: string
  historyReference?: string | null // Added for Neo4j history reference
  medications?: string[] // Added to store medication list
}

export interface Neo4jPatient {
  name: string
  age: number
  gender: string
}

export interface Neo4jPrescription {
  id: string
  blockchainHash: string
  originalPrescription: string
  status: string
  timestamp: string
  lastUpdated: string
}

export interface Neo4jIssue {
  title: string
  description: string
  severity: string
}

export interface Neo4jSuggestion {
  title: string
  description: string
}
