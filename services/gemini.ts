
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeFace = async (base64Image: string): Promise<AnalysisResult> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Analyze this man's face for grooming. Identify his face shape (oval, square, etc.) and specific facial features. Recommend 3 hairstyles. Return strictly as JSON." }
        ]
      }
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          faceShape: { type: Type.STRING },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          features: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['faceShape', 'recommendations', 'features']
      }
    }
  });

  return JSON.parse(response.text || '{}') as AnalysisResult;
};

export const applyHairstyle = async (base64Image: string, stylePrompt: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: `Edit this photo. Apply this specific men's hairstyle: ${stylePrompt}. 
        Keep the person's face, features, and background identical. Only change the hair. Ensure a realistic, professional barbershop result.` }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  // Nano banana models can return multiple parts; find the one with inlineData
  const candidate = response.candidates?.[0];
  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  
  throw new Error('No image returned from AI');
};
