import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const generateContent = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            contents: prompt
        });
        return response.text || 'No response.';
    } catch (error) {
        console.error('Error generating content:', error);
        throw new Error('Failed to generate content');
    }
};
