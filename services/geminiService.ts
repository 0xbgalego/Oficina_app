
import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const extractLicensePlate = async (base64Image: string): Promise<string | null> => {
  const ai = getAIClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: "Extract the car license plate number from this image. Only return the plate characters (letters, numbers, and dashes), nothing else. If multiple plates are visible, return the most prominent one. Return 'NULL' if no plate is detected."
          }
        ]
      },
      config: {
        temperature: 0.1,
      }
    });

    const result = response.text?.trim() || 'NULL';
    return result === 'NULL' ? null : result.toUpperCase();
  } catch (error) {
    console.error("Plate extraction error:", error);
    return null;
  }
};

export const analyzeWorkDay = async (logs: any[]): Promise<string> => {
  const ai = getAIClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyse this mechanic's work logs and give a 1-sentence motivational summary: ${JSON.stringify(logs)}`,
    });
    return response.text || "Óptimo trabalho hoje!";
  } catch {
    return "Mãos à obra!";
  }
};
