import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini on server
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === "production";

  console.log(`[Startup] Initializing Bhart AI Server...`);
  console.log(`[Startup] Environment: ${isProduction ? 'Production' : 'Development'}`);

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
      hasApiKey: !!process.env.GEMINI_API_KEY
    });
  });

  // Chat API Route (Server-Side to prevent key reveal and handle retries)
  app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body;
    
    console.log(`[Chat] Request received. Message length: ${message?.length}`);
    
    if (!process.env.GEMINI_API_KEY) {
      console.error("[Chat] Error: GEMINI_API_KEY is missing from environment.");
      return res.status(500).json({ error: "Server configuration error: Missing API Key." });
    }

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    try {
      console.log("[Chat] Calling Gemini API via @google/genai...");
      const chat = ai.chats.create({
        model: "gemini-1.5-flash",
        history: history || []
      });

      const result = await chat.sendMessage({ message });
      const text = (result as any).text || (result as any).response?.text?.() || "";
      
      console.log(`[Chat] Success. Response length: ${text.length}`);
      res.json({ text });
    } catch (error: any) {
      console.error("[Chat] API Error:", error);
      res.status(500).json({ 
        error: "Failed to generate response. The process might have been interrupted by the AI provider.",
        details: isProduction ? undefined : error.message
      });
    }
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
