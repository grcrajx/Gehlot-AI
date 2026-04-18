import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API Routes
app.get("/api/providers", (req, res) => {
  res.json([
    { id: "gemini", name: "Gemini (Google)", type: "native" },
    { id: "openai", name: "OpenAI Compatible", type: "external" },
  ]);
});

app.post("/api/chat", async (req, res) => {
  const { messages, provider, config, systemPrompt } = req.body;

  try {
    if (provider === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API key not configured on server." });
      }
      
      const genAI = new GoogleGenAI({ apiKey });
      
      const response = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: messages.map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction: systemPrompt
        }
      });
      
      return res.json({ text: response.text });
    }

    if (provider === "openai") {
      const response = await axios.post(
        config.api_url || "https://api.openai.com/v1/chat/completions",
        {
          model: config.model || "gpt-4o-mini",
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            ...messages.map((m: any) => ({ role: m.role, content: m.content }))
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${config.api_key}`,
            "Content-Type": "application/json",
          },
        }
      );
      return res.json({ text: response.data.choices[0].message.content });
    }

    res.status(400).json({ error: "Unsupported provider" });
  } catch (error: any) {
    console.error("Chat API Error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to fetch response from AI provider",
      details: error.response?.data?.error?.message || error.message 
    });
  }
});

async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

// Server listener setup
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

if (!isVercel) {
  setupServer().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
} else {
  // In Vercel, we just export the app
  setupServer();
}

export default app;
