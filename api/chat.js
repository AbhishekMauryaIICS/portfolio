// ✅ NEW GEMINI WAY
import { GoogleGenAI } from '@google/genai';

// Automatically picks up the environment variable you saved in Vercel
const ai = new GoogleGenAI(); 

export async function POST(req) {
  const { messages } = await req.json();
  
  // Extract the text prompt from your incoming frontend request
  // (Gemini takes either a direct string or structured history objects)
  const userPrompt = messages[messages.length - 1].content;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // Fast and great for portfolio chat features
    contents: userPrompt,
  });

  return new Response(JSON.stringify({ text: response.text }));
}
