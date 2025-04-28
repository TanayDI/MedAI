export interface PrescriptionResult {
  id: string;
  originalPrescription: string;
  status: "valid" | "warning" | "invalid";
  issues?: {
    title: string;
    description: string;
    severity: "low" | "medium" | "high";
  }[];
  suggestions?: {
    title: string;
    description: string;
  }[];
  dataSources: {
    vectorDbEntries: number;
    searchQueries: number;
  };
  timestamp: string;
  blockchainStatus: string;
  lastUpdated: string;
}
