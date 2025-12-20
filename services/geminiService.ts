
import { GoogleGenAI } from "@google/genai";

/**
 * 取得網頁的智慧標題
 * 遵循 Guideline：在呼叫前才初始化實例，避免模組載入時因 API Key 缺失而崩潰
 */
export const getSmartTitle = async (url: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key 尚未配置，跳過 AI 標題生成");
    return '';
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `我有一個網址： "${url}"。請為這個網站提供一個非常簡短、精煉的中文標題（最多 5 個字）。直接回傳標題文字，不要包含引號或解釋。`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return '';
  }
};

/**
 * 根據現有標題建議分類名稱
 */
export const suggestGroupCategory = async (titles: string[]): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return '新分類';

    try {
        const ai = new GoogleGenAI({ apiKey });
        const list = titles.length > 0 ? titles.join(', ') : '常用連結';
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `根據以下網站標題列表：[${list}]，請建議一個適合的中文分類名稱（最多 4 個字）。只回傳名稱。`,
        });
        return response.text.trim();
    } catch (error) {
        return '新分類';
    }
}
