
import { GoogleGenAI } from "@google/genai";

// Initialize the GoogleGenAI client with the API key directly from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartTitle = async (url: string): Promise<string> => {
  if (!process.env.API_KEY) return '';
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `I have a URL: "${url}". Please provide a short, concise title (max 3 words) in Traditional Chinese that describes this website. Do not include quotes.`,
    });
    // Use .text property directly
    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return '';
  }
};

export const suggestGroupCategory = async (titles: string[]): Promise<string> => {
    if (!process.env.API_KEY) return '新分類';
    try {
        const list = titles.length > 0 ? titles.join(', ') : '常用連結';
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Given this list of website titles: [${list}], suggest a single short category name (Traditional Chinese, max 4 chars) for a bookmark folder.`,
        });
        // Use .text property directly
        return response.text.trim();
    } catch (error) {
        return '新分類';
    }
}
