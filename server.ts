import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get API Key from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

// Initialize Gemini on server with validation
let ai: any = null;

if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  console.log(`[Startup] Gemini API Key detected (Source: ${process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 'GOOGLE_API_KEY'})`);
} else {
  console.error(`[Critical] No Gemini API Key found. Please set GEMINI_API_KEY or GOOGLE_API_KEY.`);
}

async function validateGeminiKey() {
  if (!ai) return false;
  try {
    // Minimal probe using correct @google/genai syntax
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "ping"
    });
    
    if (response && response.text) {
      console.log("[Startup] Gemini API connection validated successfully.");
      return true;
    }
    throw new Error("Empty response from model");
  } catch (error: any) {
    console.error("[Startup] Gemini API Key validation failed:", error.message);
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === "production";

  console.log(`[Startup] Initializing Bhart AI Server...`);
  console.log(`[Startup] Environment: ${isProduction ? 'Production' : 'Development'}`);

  // Validate AI at startup
  await validateGeminiKey();

  // CORS Configuration for Vercel
  app.use(cors({
    origin: ["https://bhart-ai.vercel.app", /\.vercel\.app$/, "http://localhost:3000"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
  }));

  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      mode: process.env.NODE_ENV,
      port: PORT,
      timestamp: new Date().toISOString(),
      apiKeyDetected: !!GEMINI_API_KEY
    });
  });

  // Vite middleware for development
  if (!isProduction) {
    console.log("[Vite] Running in development mode with HMR middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve the pre-built static files from /dist
    const distPath = path.resolve(process.cwd(), "dist");
    
    if (fs.existsSync(distPath)) {
      console.log(`[Static] Serving production files from: ${distPath}`);
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.error(`[Critical] 'dist' folder not found at ${distPath}. Did you run 'npm run build'?`);
      // Fallback for safety
      app.get("*", (req, res) => {
        res.status(500).send("Application build artifacts missing. Contact developer.");
      });
    }
  }

  // Bind to 0.0.0.0 to ensure the service is reachable externally on Railway
  const server = app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[Ready] Bhart AI deployed at: 0.0.0.0:${PORT}`);
    console.log(`[Ready] Public URL accessible via Railway proxy`);
  });

  // Handle server shutdown or errors
  server.on('error', (err) => {
    console.error("[Fatal] Server failed to start:", err);
    process.exit(1);
  });
}

// Graceful error handling for environment
process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UnhandledRejection] at:', promise, 'reason:', reason);
});

startServer().catch(err => {
  console.error("[Fatal] Failed to start server entry point:", err);
});
