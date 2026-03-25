import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Serve uploaded files from /objects/* path
  const uploadsDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads");
  app.use('/objects', express.static(uploadsDir));

  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(`WARNING: Build directory not found: ${distPath}`);
    // Return a simple error page instead of crashing
    app.use("*", (_req, res) => {
      res.status(503).send("Application is starting up. Please refresh in a moment.");
    });
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
