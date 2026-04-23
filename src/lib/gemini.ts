import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.warn("Neither GEMINI_API_KEY nor GOOGLE_API_KEY is defined. AI features will be disabled.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });
