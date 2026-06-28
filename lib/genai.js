import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateText(prompt, model = "gemini-2.5-flash", config) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await genAI.models.generateContent({
    model,
    contents: prompt,
    config,
  });

  const text = response?.text?.trim();
  if (!text) {
    throw new Error("Empty response from AI");
  }

  return text;
}
