
import { GoogleGenAI } from "@google/genai";

/**
 * 安全地取得 API Key
 */
const getApiKey = (): string | null => {
  try {
    const key = process.env.API_KEY;
    // 排除 undefined 字串或空值
    if (!key || key === 'undefined' || key === 'null') return null;
    return key;
  } catch (e) {
    return null;
  }
};

/**
 * 取得網頁的智慧標題
 */
export const getSmartTitle = async (url: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("Gemini API Key 遺失，將使用預設標題");
    return '';
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `我有一個網址： "${url}"。請為這個網站提供一個非常簡短、精煉的中文標題（最多 5 個字）。直接回傳標題文字，不要包含引號或解釋。`,
    });
    return response.text?.trim() || '';
  } catch (error) {
    console.error("Gemini API 請求失敗:", error);
    return '';
  }
};

/**
 * 根據現有標題建議分類名稱
 */
export const suggestGroupCategory = async (titles: string[]): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return '新分類';

    try {
        const ai = new GoogleGenAI({ apiKey });
        const list = titles.length > 0 ? titles.join(', ') : '常用連結';
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `根據以下網站標題列表：[${list}]，請建議一個適合的中文分類名稱（最多 4 個字）。只回傳名稱。`,
        });
        return response.text?.trim() || '新分類';
    } catch (error) {
        return '新分類';
    }
}
