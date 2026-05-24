/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import sharp from "sharp";
import { analyzeDocument, chatWithDocuments, generateSmartIcon, suggestTagsForDocument, detectObjectsInImage } from "./server/gemini.ts";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// AI API Routes
app.post("/api/ai/detect-objects", async (req, res) => {
  try {
    const { image } = req.body;
    const result = await detectObjectsInImage(image);
    res.json({ objects: result });
  } catch (error) {
    console.error("AI Object Detection Error:", error);
    res.status(500).json({ error: "Failed to detect objects" });
  }
});

app.post("/api/ai/suggest-tags", async (req, res) => {
  try {
    const { documentName, contentSnippet, category, currentTags } = req.body;
    const result = await suggestTagsForDocument(documentName, contentSnippet, category, currentTags);
    res.json({ tags: result });
  } catch (error) {
    console.error("AI Tag Suggestions Error:", error);
    res.status(500).json({ error: "Failed to suggest tags" });
  }
});
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { image, context } = req.body;
    const result = await analyzeDocument(image, context);
    res.json(result);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze document" });
  }
});

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history, contextDocs } = req.body;
    const result = await chatWithDocuments(message, history, contextDocs);
    res.json({ response: result });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: "Failed to process chat" });
  }
});

app.post("/api/ai/generate-asset", async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body;
    const base64 = await generateSmartIcon(prompt, aspectRatio);
    res.json({ image: `data:image/png;base64,${base64}` });
  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

// Definitions for dynamic icons
const COLORS: Record<string, string> = {
  blue: "#4F7CFF",
  indigo: "#6366F1",
  violet: "#8B5CF6",
  purple: "#A855F7",
  fuschia: "#D946EF",
  pink: "#EC4899",
  rose: "#F43F5E",
  red: "#EF4444",
  orange: "#F97316",
  amber: "#F59E0B",
  yellow: "#EAB308",
  lime: "#84CC16",
  green: "#22C55E",
  emerald: "#10B981",
  teal: "#14B8A6",
  cyan: "#06B6D4",
  sky: "#0EA5E9",
  slate: "#64748B",
  stone: "#78716C",
  zinc: "#71717A",
};

const SHAPES: Record<string, string> = {
  circle: '<circle cx="50" cy="50" r="45" />',
  square: '<rect x="10" y="10" width="80" height="80" rx="20" />',
  sharp_square: '<rect x="5" y="5" width="90" height="90" rx="0" />',
  triangle: '<path d="M50 10 L90 85 L10 85 Z" />',
  hexagon: '<path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" />',
  octagon: '<path d="M30 5 L70 5 L95 30 L95 70 L70 95 L30 95 L5 70 L5 30 Z" />',
  diamond: '<path d="M50 5 L95 50 L50 95 L5 50 Z" />',
  star: '<path d="M50 5 L63 35 L95 35 L70 55 L80 85 L50 65 L20 85 L30 55 L5 35 L37 35 Z" />',
  shield: '<path d="M10 10 L50 5 L90 10 L90 60 C90 85 50 95 50 95 C50 95 10 85 10 60 Z" />',
  drop: '<path d="M50 5 C50 5 10 45 10 70 C10 85 28 95 50 95 C72 95 90 85 90 70 C90 45 50 5 50 5 Z" />',
  capsule: '<rect x="30" y="5" width="40" height="90" rx="20" />',
  squircle: '<path d="M50 5 C10 5 5 10 5 50 C5 90 10 95 50 95 C90 95 95 90 95 50 C95 10 90 5 50 5 Z" />',
  rhombus: '<path d="M50 10 L85 50 L50 90 L15 50 Z" />',
  pentagon: '<path d="M50 5 L95 38 L78 92 L22 92 L5 38 Z" />',
  cross: '<path d="M35 5 H65 V35 H95 V65 H65 V95 H35 V65 H5 V35 H35 Z" />',
  cloud: '<path d="M25 50 C25 35 45 35 50 40 C55 30 85 30 85 55 C85 75 75 85 55 85 L25 85 C10 85 10 60 25 50 Z" />',
  ring: '<path d="M50 5 A45 45 0 1 0 50 95 A45 45 0 1 0 50 5 M50 25 A25 25 0 1 1 50 75 A25 25 0 1 1 50 25" />',
  arch: '<path d="M10 90 V40 C10 15 50 15 50 15 C50 15 90 15 90 40 V90 H70 V40 C70 30 50 30 50 30 C50 30 30 30 30 40 V90 Z" />',
  wave: '<path d="M0 50 Q25 30 50 50 T100 50 V90 H0 Z" />',
  heart: '<path d="M50 35 C50 15 10 15 10 45 C10 80 50 95 50 95 C50 95 90 80 90 45 C90 15 50 15 50 35 Z" />'
};

function generateSVG(color: string, shapeKey: string, size: number = 512): string {
  const hexColor = COLORS[color] || COLORS.blue;
  const shape = SHAPES[shapeKey] || SHAPES.circle;
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${hexColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${hexColor};stop-opacity:0.7" />
        </linearGradient>
      </defs>
      <g fill="url(#grad)">
        ${shape}
      </g>
      <text x="50" y="88" font-family="Arial, sans-serif" font-size="5" font-weight="900" fill="white" text-anchor="middle" opacity="0.4" style="letter-spacing: 1px">ROIVA</text>
      <!-- Logo center icon: ZenScan symbol -->
      <g transform="translate(32, 32) scale(1.5)" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <rect x="7" y="7" width="10" height="10" rx="1" />
      </g>
    </svg>
  `;
}

// API Routes
app.get("/api/icon", async (req, res) => {
  const { color = "blue", shape = "circle", size = "512", format = "svg" } = req.query;
  const svg = generateSVG(color as string, shape as string, parseInt(size as string));

  if (format === "png") {
    try {
      const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.send(pngBuffer);
    } catch (error) {
      console.error("Error generating PNG:", error);
      res.status(500).send("Error generating PNG");
    }
  } else {
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(svg);
  }
});

// Dynamic Manifest
app.get("/api/manifest.json", (req, res) => {
  const { color = "blue", shape = "circle" } = req.query;
  const manifest = {
    name: "ZenScan AI",
    short_name: "ZenScan",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: COLORS[color as string] || COLORS.blue,
    icons: [
      {
        src: `/api/icon?color=${color}&shape=${shape}&size=192&format=png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: `/api/icon?color=${color}&shape=${shape}&size=512&format=png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  };
  res.json(manifest);
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
