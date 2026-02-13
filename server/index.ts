import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleInitStorage } from "./routes/init-storage";
import { handleDocumentUpload, handleRefreshSignedUrl } from "./routes/document-upload";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "100mb" })); // Allow large file uploads
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Storage initialization route
  app.post("/api/init-storage", handleInitStorage);

  // Document upload routes
  app.post("/api/documents/upload", handleDocumentUpload);
  app.post("/api/documents/refresh-url", handleRefreshSignedUrl);

  return app;
}
