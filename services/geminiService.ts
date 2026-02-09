
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
            text: "Identify the vehicle license plate in this zoomed image. Return ONLY the plate characters. Format doesn't matter (can include dashes or dots). If no plate is found, return 'NULL'."
          }
        ]
      },
      config: {
        temperature: 0.1,
      }
    });

    const result = response.text?.trim() || 'NULL';
    if (result === 'NULL' || result.length < 3) return null;
    
    // Limpeza básica: remove espaços e caracteres estranhos, mantém letras, números e traços
    return result.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
  } catch (error) {
    console.error("Erro API Gemini:", error);
    return null;
  }
};
