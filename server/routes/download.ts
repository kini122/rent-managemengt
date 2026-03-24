import { RequestHandler } from "express";

export const handleDownload: RequestHandler = (req, res) => {
  try {
    const { base64, filename, contentType } = req.body;
    
    if (!base64 || !filename) {
       res.status(400).send("Missing parameters");
       return;
    }

    const buffer = Buffer.from(base64, "base64");

    res.setHeader("Content-Disposition", `attachment; filename="${filename.replace(/"/g, '\\"')}"`);
    res.setHeader("Content-Type", contentType || "application/octet-stream");
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error("Download endpoint error:", error);
    res.status(500).send("Server error generating download");
  }
};
