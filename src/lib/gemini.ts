import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function askGemini(userMessage: string, tradesContext: any) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('AI Engine configuration missing. Please ensure GEMINI_API_KEY is set in Secrets.');
  }

  const systemInstruction = `You are a professional trading coach and performance analyst for "Trading Alpha". 
  
  CONTEXT: Recent trade data (Last 20 trades):
  ${JSON.stringify(tradesContext, null, 2)}
  
  TASK:
  1. Analyze patterns, strengths, and weaknesses.
  2. Provide specific actionable coaching advice.
  3. Use ₹ for Indian Rupee amounts.
  4. Format with clean Markdown (headers, lists, bold text).
  5. Keep it professional, data-driven, and supportive.
  
  If there are no trades yet, encourage the user to log their first execution to start the analysis.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userMessage,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "I processed your request but couldn't generate a text response. Please try again.";
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    if (error.message?.includes('entity was not found') || error.message?.includes('404')) {
      throw new Error('Analytic engine not found. This might be a temporary region issue. Please try again.');
    }
    throw error;
  }
}
