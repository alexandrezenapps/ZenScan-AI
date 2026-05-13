import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function chatWithAI(message: string, history: { role: 'user' | 'assistant', content: string }[] = []) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...(history || []).map(m => ({ 
          role: m.role === 'assistant' ? 'model' : 'user', 
          parts: [{ text: m.content }] 
        })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: "Tu es Zen AI, un assistant de gestion documentaire intelligent. Tu aides les utilisateurs à analyser, résumer et organiser leurs documents. Sois professionnel et expert.",
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini AI Service Error:", error);
    throw error;
  }
}

export async function analyzeDocument(content: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyse ce texte extrait d'un document et extrais les informations clés (type, montant, date, entités) au format JSON simplifié. Ne renvoie QUE le JSON sans markdown. : \n\n${content}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            amount: { type: Type.STRING },
            date: { type: Type.STRING },
            entities: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Analysis Service Error:", error);
    return null;
  }
}
