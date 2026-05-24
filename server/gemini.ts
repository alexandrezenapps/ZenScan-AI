import { GoogleGenAI, Type } from "@google/genai";
import sharp from "sharp";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// ==========================================
// FALLBACK ENGINES FOR OFFLINE / 403 ACCESS
// ==========================================

function getFallbackTags(documentName: string, contentSnippet?: string, category?: string, currentTags: string[] = []): string[] {
  const tags: string[] = [];
  
  if (category) {
    const cat = category.toLowerCase().trim();
    if (cat.includes('facture') || cat.includes('reçu') || cat.includes('recu') || cat.includes('invoice') || cat.includes('achat')) {
      tags.push('Facture', 'Justificatif', 'Comptabilité', 'Paiement');
    } else if (cat.includes('contrat') || cat.includes('accord') || cat.includes('signé')) {
      tags.push('Contrat', 'Légal', 'Officiel', 'Accord');
    } else if (cat.includes('identit') || cat.includes('id') || cat.includes('passeport') || cat.includes('permis') || cat.includes('carte')) {
      tags.push('ID', 'Identité', 'Personnel', 'Administratif');
    } else if (cat.includes('médical') || cat.includes('medical') || cat.includes('santé') || cat.includes('sante') || cat.includes('ordonnance')) {
      tags.push('Santé', 'Médical', 'Remboursement', 'Ordonnance');
    } else if (cat.includes('note') || cat.includes('mémo') || cat.includes('memo') || cat.includes('rapport')) {
      tags.push('Note', 'Mémo', 'Rappel', 'Brouillon');
    } else {
      tags.push('ZenScan', category);
    }
  }

  if (documentName) {
    const words = documentName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9éèàâç_-\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['avec', 'pour', 'dans', 'sans', 'document', 'scan', 'scanné', 'image', 'fichier'].includes(w));
    
    words.forEach(w => {
      const cap = w.charAt(0).toUpperCase() + w.slice(1);
      if (!tags.includes(cap)) {
        tags.push(cap);
      }
    });
  }

  const existingLower = currentTags.map(c => c.toLowerCase());
  return tags
    .filter(t => !existingLower.includes(t.toLowerCase()))
    .slice(0, 5);
}

const getFallbackAnalysis = (textContext?: string) => {
  const ocr = (textContext || "").toLowerCase();
  let category = "Note";
  let name = "Scanner Document";
  const extractedData: Record<string, any> = {};
  let contentSnippet = "Mémo ou capture d'écran importée";
  
  if (ocr.includes("facture") || ocr.includes("invoice") || ocr.includes("tva") || ocr.includes("total à payer") || ocr.includes("compte client") || ocr.includes("montant")) {
    category = "Facture";
    name = "Facture / Justificatif";
    contentSnippet = "Document financier original / Preuve d'achat";
    
    const amountMatch = (textContext || "").match(/(\d+[\.,]\d{2})\s*(?:€|EUR|usd|\$)/i) 
                     || (textContext || "").match(/(?:€|EUR|usd|\$)\s*(\d+[\.,]\d{2})/i)
                     || (textContext || "").match(/total\s+:?\s*(\d+[\.,]\d{2})/i);
    if (amountMatch) {
      extractedData["Montant"] = amountMatch[1].replace(',', '.') + " €";
    }
    
    const invMatch = (textContext || "").match(/(?:facture|invoice|n°)\s*:?\s*([A-Z0-9--_]{4,15})/i);
    if (invMatch) {
      extractedData["N° Facture"] = invMatch[1];
    }
  } else if (ocr.includes("contrat") || ocr.includes("accord") || ocr.includes("article ") || ocr.includes("conclut") || ocr.includes("conclu entre")) {
    category = "Contrat";
    name = "Contrat ou Accord officiel";
    contentSnippet = "Document d'accord contractuel ou légal officiel";
  } else if (ocr.includes("carte nationale d'identité") || ocr.includes("passeport") || ocr.includes("nationalité") || ocr.includes("republique francaise") || ocr.includes("permis de conduire")) {
    category = "Identité";
    name = "Pièce d'Identité";
    contentSnippet = "Document d'identité officiel scanneur";
    
    const nomMatch = (textContext || "").match(/nom\s*:?\s*([A-ZÀ-ÿ\s]+)/i);
    if (nomMatch) extractedData["Nom"] = nomMatch[1].trim().split('\n')[0];
  } else if (ocr.includes("ordonnance") || ocr.includes("médical") || ocr.includes("docteur") || ocr.includes("médecin") || ocr.includes("pharmacie") || ocr.includes("symptôme")) {
    category = "Médical";
    name = "Ordonnance Médicale";
    contentSnippet = "Ordonnance ou compte-rendu médical officiel";
  } else if (ocr.includes("ticket") || ocr.includes("reçu") || ocr.includes("carte bancaire") || ocr.includes("caisse") || ocr.includes("débit")) {
    category = "Reçu";
    name = "Ticket / Reçu";
    contentSnippet = "Ticket de caisse / Justificatif d'achat CB";
  }
  
  const dateMatch = (textContext || "").match(/(\d{2}[\/\.-]\d{2}[\/\.-]\d{2,4})/);
  if (dateMatch) {
    extractedData["Date"] = dateMatch[1];
  }

  if (textContext && textContext.trim().length > 0) {
    contentSnippet = textContext.replace(/\s+/g, " ").substring(0, 95) + "...";
  }

  const tags = getFallbackTags(name, contentSnippet, category);

  return {
    name,
    category,
    extractedData,
    contentSnippet,
    tags,
    type: "JPG"
  };
};

const getFallbackChatResponse = (message: string, contextDocs: any[]) => {
  const msg = message.toLowerCase();
  
  if (msg.includes("bonjour") || msg.includes("salut") || msg.includes("hello") || msg.includes("coucou")) {
    return `Bonjour ! Je suis ZenScan AI. L'analyse cloud avancée de votre projet est temporairement indisponible (erreur 403), mais je reste entièrement disponible localement pour répondre à vos questions directement à partir de vos documents. Que souhaitez-vous savoir ?`;
  }

  if (msg.includes("facture") || msg.includes("factures") || msg.includes("paye") || msg.includes("reçu") || msg.includes("recu")) {
    const factures = contextDocs.filter(d => d.category?.toLowerCase() === 'facture' || d.category?.toLowerCase() === 'reçu');
    if (factures.length === 0) {
      return `Je n'ai trouvé aucune facture ou reçu enregistré. Vous pouvez scanner un nouveau document ou importer un reçu pour commencer !`;
    }
    const names = factures.map(f => `- **${f.name}**${f.extractedData?.Montant ? ` (${f.extractedData.Montant})` : ''}`).join('\n');
    return `Voici les factures et reçus identifiés (${factures.length}) :\n${names}\n\nQue voulez-vous savoir sur ces documents ?`;
  }

  if (msg.includes("combien") || msg.includes("montant") || msg.includes("total") || msg.includes("argent") || msg.includes("somme")) {
    let sum = 0;
    const itemsWithAmt: string[] = [];
    contextDocs.forEach(d => {
      const amtStr = d.extractedData?.Montant || d.extractedData?.["Montant Total"] || d.extractedData?.["Total"] || d.extractedData?.amount;
      if (amtStr) {
        const parsed = parseFloat(String(amtStr).replace(/[^0-9\.,]/g, '').replace(',', '.'));
        if (!isNaN(parsed)) {
          sum += parsed;
          itemsWithAmt.push(`- **${d.name}**: ${amtStr}`);
        }
      }
    });

    if (itemsWithAmt.length > 0) {
      return `D'après vos documents, j'ai comptabilisé un total cumulé de **${sum.toFixed(2)} €**. Voici le détail :\n${itemsWithAmt.join('\n')}`;
    }
    return `Je n'ai détecté aucun montant clair extrait de vos documents. N'hésitez pas à spécifier le document dont vous parlez !`;
  }

  if (contextDocs.length > 0) {
    for (const doc of contextDocs) {
      const docName = doc.name.toLowerCase();
      if (msg.includes(docName) || (doc.category && msg.includes(doc.category.toLowerCase()))) {
        const details = Object.entries(doc.extractedData || {})
          .map(([k, v]) => `- **${k}** : ${v}`)
          .join('\n');
        return `Voici les informations extraites de **${doc.name}** (Catégorie: *${doc.category || 'Autre'}*) :
${details || "*Pas de données structurées supplémentaires.*"}

*Résumé de contenu :* ${doc.contentSnippet || "Non fourni."}
*Mots-clés :* ${doc.tags?.join(', ') || "Aucun tag"}`;
      }
    }
  }

  return `Je suis l'assistant "ZenScan AI". Malgré la restriction d'accès cloud (PERMISSION_DENIED), vos données locales sont préservées. Je gère actuellement ${contextDocs.length} de vos documents. Vous pouvez explorer vos statistiques de coffre, et gérer vos sauvegardes Cloud dans l'interface !`;
};


export const analyzeDocument = async (base64Image: string, textContext?: string) => {
  try {
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
      model: "gemini-3.5-flash",
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
  } catch (error) {
    console.error("[Gemini] SDK analyzeDocument failed. Invoking OCR heuristic fallback:", error);
    return getFallbackAnalysis(textContext);
  }
};

export const chatWithDocuments = async (message: string, history: any[], contextDocs: any[]) => {
  try {
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
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

    return response.text || "";
  } catch (error) {
    console.error("[Gemini] SDK chatWithDocuments failed. Invoking logic-based fallback:", error);
    return getFallbackChatResponse(message, contextDocs);
  }
};

export const generateSmartIcon = async (prompt: string, aspectRatio: "1:1" | "16:9" | "9:16" = "1:1") => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
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
  } catch (err) {
    console.error("[Gemini] SDK generateSmartIcon failed. Rendering high-quality fallback SVG:", err);
  }

  // Beautiful fallback visual graphic
  const fallbackSvg = `
    <svg width="512" height="512" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="fallbackGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#3B82F6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#fallbackGrad)" />
      <g stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(30, 30) scale(1.6)">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </g>
    </svg>
  `;
  try {
    const pngBuffer = await sharp(Buffer.from(fallbackSvg)).png().toBuffer();
    return pngBuffer.toString('base64');
  } catch (sharpErr) {
    console.error("Sharp rasterization failed, returning raw base64 SVG:", sharpErr);
    return Buffer.from(fallbackSvg).toString('base64');
  }
};

export const suggestTagsForDocument = async (documentName: string, contentSnippet?: string, category?: string, currentTags: string[] = []) => {
  const prompt = `Tu es un assistant expert en classification de documents pour "ZenScan AI".
  Propose une liste de 4 à 6 tags (mots-clés simples, max 15 caractères, sans espaces si possible, ex: "Impôts", "Urgent", "Contrat", "EDF", "Abonnement", "2026") pertinents pour ce document, en évitant les doublons avec les tags existants de l'utilisateur.

  Détails du document :
  - Nom : ${documentName}
  - Catégorie : ${category || 'Non renseignée'}
  - Résumé du contenu : ${contentSnippet || 'Non renseigné'}
  - Tags existants : ${JSON.stringify(currentTags)}

  Réponds EXCLUSIVEMENT sous forme d'un tableau JSON de chaînes de caractères (array of strings) contenant uniquement les nouveaux tags proposés. Exemple : ["Tag1", "Tag2", "Tag3"]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text || "[]";
    const suggested = JSON.parse(text);
    if (Array.isArray(suggested)) {
      return suggested
        .map(t => typeof t === 'string' ? t.trim() : '')
        .filter(t => t.length > 0 && !currentTags.map(ct => ct.toLowerCase()).includes(t.toLowerCase()))
        .slice(0, 8);
    }
  } catch (error) {
    console.error("[Gemini] SDK suggestTagsForDocument failed. Invoking heuristic tag suggestion fallback:", error);
  }

  // Use elegant local fallback
  return getFallbackTags(documentName, contentSnippet, category, currentTags);
};

export const detectObjectsInImage = async (base64Image: string) => {
  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.split(',')[1] || base64Image,
    },
  };

  const promptPart = {
    text: `You are an expert real-time object detection and translation AI system.
    Identify and locate prominent, interesting, or clear objects visible in the camera frame.
    For each object, provide:
    1. English name (name_en)
    2. French translation / name (name_fr)
    3. Chinese translation / name (name_zh) with Hanzi and Pinyin in parentheses, e.g. "手机 (Shǒujī)"
    4. Normalized bounding box coordinates: [ymin, xmin, ymax, xmax] where each value is an integer from 0 to 100 denoting percentage of vertical (y) and horizontal (x) range of the frame.
    
    Detect between 1 and 6 main objects visible. Avoid false positives. Respond only in valid JSON format matching the schema requested.`,
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, promptPart],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            objects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name_en: { type: Type.STRING },
                  name_fr: { type: Type.STRING },
                  name_zh: { type: Type.STRING },
                  boundingBox: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: "Array of exactly 4 integers [ymin, xmin, ymax, xmax] representing percentage coords (0-100)"
                  }
                },
                required: ["name_en", "name_fr", "name_zh", "boundingBox"]
              }
            }
          },
          required: ["objects"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{"objects": []}');
    return parsed.objects || [];
  } catch (error) {
    console.error("[Gemini] SDK detectObjectsInImage failed. Returning empty objects set.", error);
    return [];
  }
};
