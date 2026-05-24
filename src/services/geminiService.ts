
export async function chatWithAI(message: string, history: { role: 'user' | 'assistant', content: string }[] = [], contextDocs: any[] = []) {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, contextDocs })
    });
    
    if (!response.ok) throw new Error('AI request failed');
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Gemini AI Client Error:", error);
    throw error;
  }
}

export async function analyzeDocument(image: string, context?: string) {
  try {
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, context })
    });
    
    if (!response.ok) throw new Error('Analysis request failed');
    return await response.json();
  } catch (error) {
    console.error("Gemini Analysis Client Error:", error);
    return null;
  }
}

export async function suggestTagsForDocument(documentName: string, contentSnippet?: string, category?: string, currentTags: string[] = []) {
  try {
    const response = await fetch('/api/ai/suggest-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentName, contentSnippet, category, currentTags })
    });

    if (!response.ok) throw new Error('Tag suggestions request failed');
    const data = await response.json();
    return data.tags as string[];
  } catch (error) {
    console.error("Gemini Tag Suggestions Client Error:", error);
    return [];
  }
}

export interface DetectedObject {
  name_en: string;
  name_fr: string;
  name_zh: string;
  boundingBox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] as percentages
}

export async function detectObjectsInImage(image: string): Promise<DetectedObject[]> {
  try {
    const response = await fetch('/api/ai/detect-objects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image })
    });

    if (!response.ok) throw new Error('Object detection request failed');
    const data = await response.json();
    return data.objects as DetectedObject[];
  } catch (error) {
    console.error("Gemini Object Detection Client Error:", error);
    return [];
  }
}


