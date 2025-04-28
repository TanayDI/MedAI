import { generateObject, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Define the schema for medicine information
const medicineSchema = z.object({
  name: z.string(),
  dosage: z.string(),
  interactions: z.array(z.string()),
  sideEffects: z.array(z.string()),
  contraindications: z.array(z.string()),
});

// Vector database search tool
export const searchVectorDatabase = tool({
  description: "Search the vector database for medicine information",
  parameters: z.object({
    medicineName: z.string().describe("The name of the medicine to search for"),
  }),
  execute: async ({ medicineName }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

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
    };

    // Normalize the medicine name for lookup
    const normalizedName = medicineName.toLowerCase().trim();

    // Find the medicine in our mock database
    for (const key in medicines) {
      if (key.includes(normalizedName) || normalizedName.includes(key)) {
        return medicines[key];
      }
    }

    // Return null if not found
    return null;
  },
});

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
    await new Promise((resolve) => setTimeout(resolve, 1000));

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
    };
  },
});

// Function to analyze a prescription using Gemini AI
export async function analyzePrescriptionWithRAG(prescription: string, patientInfo: any) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Gather medicine information using existing tools
    const medications = prescription.split(/[,\n]/).map(med => med.trim());
    const medicineData = await Promise.all(
      medications.map(med => searchVectorDatabase.execute({ medicineName: med }, { toolCallId: "unique-id", messages: [] }))
    );

    const prompt = `
      You are a medical AI assistant specialized in prescription analysis.
      
      Patient Information:
      - Name: ${patientInfo.name}
      - Age: ${patientInfo.age}
      - Gender: ${patientInfo.gender}
      - Current Medications: ${patientInfo.medications}
      - Symptoms: ${patientInfo.symptoms}
      
      Prescription to analyze:
      ${prescription}
      
      Medicine Database Information:
      ${JSON.stringify(medicineData, null, 2)}
      
      Provide your analysis as a strict JSON object (no markdown formatting, no code blocks) with this structure:
      {
        "status": "valid" | "warning" | "invalid",
        "issues": [{ "title": string, "description": string, "severity": "low" | "medium" | "high" }],
        "suggestions": [{ "title": string, "description": string }],
        "dataSources": { "vectorDbEntries": number, "searchQueries": number }
      }
      
      Important: Return only the JSON object, with no additional text, markdown, or formatting.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let analysisText = response.text();

    // Clean up any markdown or code block formatting
    analysisText = analysisText.replace(/```json\n?/g, '')
                              .replace(/```\n?/g, '')
                              .trim();

    try {
      const analysis = JSON.parse(analysisText);
      // Define the schema for the analysis response
      const analysisSchema = z.object({
        status: z.enum(["valid", "warning", "invalid"]),
        issues: z.array(
          z.object({
            title: z.string(),
            description: z.string(),
            severity: z.enum(["low", "medium", "high"]),
          })
        ),
        suggestions: z.array(
          z.object({
            title: z.string(),
            description: z.string(),
          })
        ),
        dataSources: z.object({
          vectorDbEntries: z.number(),
          searchQueries: z.number(),
        }),
      });

      return analysisSchema.parse(analysis);
    } catch (jsonError) {
      console.error("Failed to parse AI response:", analysisText);
      throw new Error("Invalid AI response format");
    }
  } catch (error) {
    console.error("Error analyzing prescription:", error);
    throw error;
  }
}
