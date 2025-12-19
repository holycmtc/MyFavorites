import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getSmartTitle = async (url: string): Promise<string> => {
  if (!apiKey) return '';
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `I have a URL: "${url}". Please provide a short, concise title (max 3 words) in Traditional Chinese that describes this website. Do not include quotes.`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return '';
  }
};

export const suggestGroupCategory = async (titles: string[]): Promise<string> => {
    if (!apiKey) return '';
    try {
        const list = titles.length > 0 ? titles.join(', ') : '常用連結';
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Given this list of website titles: [${list}], suggest a single short category name (Traditional Chinese, max 4 chars) for a bookmark folder.`,
        });
        return response.text.trim();
    } catch (error) {
        return '新分類';
    }
}