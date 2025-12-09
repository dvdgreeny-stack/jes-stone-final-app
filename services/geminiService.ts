import { GoogleGenAI, Chat } from "@google/genai";
import type { SurveyData, Company } from '../types';

export async function generateNotesDraft(formData: Partial<SurveyData>, companyData: Company[], companyName: string): Promise<string> {
  // Lazy initialization of the Gemini client
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const property = companyData.flatMap(c => c.properties).find(p => p.id === formData.propertyId);

  const context = `
    - Company: ${companyName}
    - Property: ${property?.name || 'N/A'}
    - Contact: ${formData.firstName || ''} ${formData.lastName || ''} (${formData.title || 'N/A'})
    - Services needed: ${formData.services?.join(', ') || 'N/A'}
    - Unit/Area Info: ${formData.unitInfo || 'N/A'}
    - Timeline: ${formData.timeline || 'N/A'}
  `;

  const prompt = `
    You are an assistant for a property manager filling out a service request form for Jes Stone Remodeling and Granite.
    Based on the following request details, write a brief, professional, and clear message for the "Additional Notes" section.
    Summarize the key information and needs. Be concise and direct.

    Request Details:
    ${context}

    Draft a note that can be sent as is. For example: "We are looking to get a quote for [services] for [unit info]. The timeline is [timeline]. Please let us know availability."
  `;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    return response.text?.trim() ?? "Failed to generate a draft. Please try again.";
  } catch (error) {
    console.error("Error calling Gemini API for notes draft:", error);
    throw new Error("Failed to generate notes draft from Gemini API.");
  }
}

export function createChatSession(systemInstruction?: string): Chat {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction || "You are a helpful assistant for Jes Stone Remodeling and Granite. Your goal is to assist property managers in understanding our services (Countertops, Cabinets, Tile, Make-Ready) and filling out the service request survey. Be professional, concise, and helpful.",
    }
  });
}