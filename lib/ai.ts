import { tool } from "ai"
import { GoogleGenerativeAI, type Part } from "@google/generative-ai"
import { z } from "zod"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

// Define the schema for medicine information
const medicineSchema = z.object({
  name: z.string(),
  dosage: z.string(),
  interactions: z.array(z.string()),
  sideEffects: z.array(z.string()),
  contraindications: z.array(z.string()),
})

// Vector database search tool
export const searchVectorDatabase = tool({
  description: "Search the vector database for medicine information",
  parameters: z.object({
    medicineName: z.string().describe("The name of the medicine to search for"),
  }),
  execute: async ({ medicineName }) => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock data for common medications
    const medicines: Record<string, any> = {
      lisinopril: {
        name: "Lisinopril",
        dosage: "10-40mg daily",
        interactions: ["Potassium supplements", "Lithium", "NSAIDs"],
        sideEffects: ["Dry cough", "Dizziness", "Headache"],
        contraindications: ["Pregnancy", "History of angioedema"],
      },
      metformin: {
        name: "Metformin",
        dosage: "500-2000mg daily in divided doses",
        interactions: ["Alcohol", "Contrast dyes", "Certain diuretics"],
        sideEffects: ["Nausea", "Diarrhea", "Vitamin B12 deficiency"],
        contraindications: ["Kidney disease", "Liver disease", "Heart failure"],
      },
      atorvastatin: {
        name: "Atorvastatin",
        dosage: "10-80mg daily",
        interactions: ["Grapefruit juice", "Certain antibiotics", "Cyclosporine"],
        sideEffects: ["Muscle pain", "Liver problems", "Increased blood sugar"],
        contraindications: ["Liver disease", "Pregnancy", "Breastfeeding"],
      },
    }

    // Normalize the medicine name for lookup
    const normalizedName = medicineName.toLowerCase().trim()

    // Find the medicine in our mock database
    for (const key in medicines) {
      if (key.includes(normalizedName) || normalizedName.includes(key)) {
        return medicines[key]
      }
    }

    // Return null if not found
    return null
  },
})

// Online search tool
export const searchOnline = tool({
  description: "Search online for medicine information",
  parameters: z.object({
    query: z.string().describe("The search query for medicine information"),
  }),
  execute: async ({ query }) => {
    // This is a mock implementation
    // In a real application, this would perform an actual web search

    // Simulate search delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Return mock search results
    return {
      results: [
        {
          title: `Information about ${query}`,
          snippet: `${query} is commonly prescribed for various conditions. Always consult with your healthcare provider for specific advice.`,
          url: `https://example.com/medicine/${query.toLowerCase().replace(/\s+/g, "-")}`,
        },
        {
          title: `${query} Side Effects and Interactions`,
          snippet: `Common side effects of ${query} include headache, nausea, and dizziness. It may interact with other medications.`,
          url: `https://example.com/side-effects/${query.toLowerCase().replace(/\s+/g, "-")}`,
        },
        {
          title: `${query} Dosage Guidelines`,
          snippet: `Typical dosage for ${query} varies based on condition, age, and other factors. Follow your doctor's recommendations.`,
          url: `https://example.com/dosage/${query.toLowerCase().replace(/\s+/g, "-")}`,
        },
      ],
    }
  },
})

// Function to analyze a prescription using Gemini AI
export async function analyzePrescriptionWithRAG(
  prescription: string,
  patientInfo: any,
  prescriptionImage?: string, // Base64 string of the image
) {
  try {
    // Use vision model when image is provided
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    })

    // Gather medicine information using existing tools
    const medications = prescription.split(/[,\n]/).map((med) => med.trim())
    const medicineData = await Promise.all(
      medications.map((med) =>
        searchVectorDatabase.execute({ medicineName: med }, { toolCallId: "unique-id", messages: [] }),
      ),
    )

    // Prepare parts array for the model
    const parts: Part[] = []

    // Add text part first
    parts.push({
      text: `
        Patient Information:
        - Name: ${patientInfo.name}
        - Age: ${patientInfo.age}
        - Gender: ${patientInfo.gender}
        - Current Medications: ${patientInfo.medications}
        - Symptoms: ${patientInfo.symptoms}

        ${prescription ? `Prescription to analyze:\n${prescription}\n` : ""}
        ${prescriptionImage ? "Also analyze the provided prescription image." : ""}

        Medicine Database Information:
        ${JSON.stringify(medicineData, null, 2)}

        ${
          patientInfo.patientHistory
            ? `
        Previous Prescription History (from Neo4j database):
        ${JSON.stringify(patientInfo.patientHistory, null, 2)}
        
        When analyzing this prescription, please consider:
        1. Previous medications the patient has taken
        2. Previous issues or warnings identified
        3. Any patterns in the prescription history that could affect the current prescription
        `
            : "No previous prescription history available."
        }

        Provide your analysis as a strict JSON object with this structure:
        {
          "status": "valid" | "warning" | "invalid",
          "issues": [{ "title": string, "description": string, "severity": "low" | "medium" | "high" }],
          "suggestions": [{ "title": string, "description": string }],
          "dataSources": { "vectorDbEntries": number, "searchQueries": number },
          "imageAnalysis": string | null,
          "historyReference": string | null
        }

        Important: Return only the JSON object, with no additional text, markdown, or formatting.
        In the historyReference field, include a brief analysis of how the current prescription relates to the patient's history.
      `,
    })

    // Add image part if provided
    if (prescriptionImage) {
      const mimeTypeMatch = prescriptionImage.match(/^data:image\/(png|jpg|jpeg|webp);base64,/)
      const mimeType = mimeTypeMatch ? `image/${mimeTypeMatch[1]}` : "image/jpeg"

      parts.push({
        inline_data: {
          data: prescriptionImage.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, ""),
          mime_type: mimeType,
        },
      } as unknown as Part)
    }

    // Generate content with parts
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts,
        },
      ],
    })

    const response = await result.response
    let analysisText = response.text()

    // Clean up formatting
    analysisText = analysisText.replace(/```json|```/g, "").trim()
    console.log("AI Response:", analysisText)

    try {
      const analysis = JSON.parse(analysisText)
      // Update schema to include imageAnalysis and historyReference
      const analysisSchema = z.object({
        status: z.enum(["valid", "warning", "invalid"]),
        issues: z.array(
          z.object({
            title: z.string(),
            description: z.string(),
            severity: z.enum(["low", "medium", "high"]),
          }),
        ),
        suggestions: z.array(
          z.object({
            title: z.string(),
            description: z.string(),
          }),
        ),
        dataSources: z.object({
          vectorDbEntries: z.number(),
          searchQueries: z.number(),
        }),
        imageAnalysis: z.string().nullable(),
        historyReference: z.string().nullable(),
      })

      return analysisSchema.parse(analysis)
    } catch (jsonError) {
      console.error("Failed to parse AI response:", analysisText)
      throw new Error("Invalid AI response format")
    }
  } catch (error) {
    console.error("Error analyzing prescription:", error)
    throw error
  }
}
