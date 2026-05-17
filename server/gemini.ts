import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export const analyzeDocument = async (base64Image: string, textContext?: string) => {
  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.split(',')[1] || base64Image,
    },
  };

  const promptPart = {
    text: `Tu es un assistant expert en analyse de documents pour "ZenScan AI". 
    Analyse cette image de document et extrais les informations suivantes au format JSON :
    - name: Un titre court et descriptif pour le document.
    - category: La catégorie (ex: Facture, Reçu, Identité, Contrat, Note, Médical, Autre).
    - extractedData: Un objet contenant les informations clés (ex: montant, date, numéro, nom de l'entreprise).
    - contentSnippet: Un résumé très court (max 100 caractères) du contenu.
    - tags: Un tableau de 3-5 mots-clés pertinents.
    - type: Le format probable (PDF, JPG, PNG).
    
    Contexte supplémentaire (OCR brut) : ${textContext || 'Non fourni'}
    
    Réponds EXCLUSIVEMENT en JSON valide.`,
  };

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: { parts: [imagePart, promptPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          extractedData: { type: Type.OBJECT },
          contentSnippet: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          type: { type: Type.STRING }
        },
        required: ["name", "category", "contentSnippet"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const chatWithDocuments = async (message: string, history: any[], contextDocs: any[]) => {
  const chat = ai.chats.create({
    model: "gemini-1.5-flash",
    config: {
      systemInstruction: `Tu es l'intelligence "ZenScan AI". Tu aides l'utilisateur à gérer ses documents scannés.
      Voici les documents de l'utilisateur pour contexte : ${JSON.stringify(contextDocs)}
      Réponds de manière concise, professionnelle et utile. Si l'utilisateur pose une question sur un document précis, analyse les données extraites fournies dans le contexte.
      Tu parles en Français.`,
    },
  });

  const response = await chat.sendMessage({ 
    message: message 
  });

  return response.text;
};

export const generateSmartIcon = async (prompt: string, aspectRatio: "1:1" | "16:9" | "9:16" = "1:1") => {
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  throw new Error("No image generated");
};
