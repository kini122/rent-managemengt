import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const BUCKET_NAME = "tenancy_documents";

/**
 * Secure document upload endpoint
 * Uses service role key for backend authentication - no RLS issues
 * Returns signed URL for secure file access
 */
export const handleDocumentUpload: RequestHandler = async (req, res) => {
  try {
    const { tenancyId, documentType, fileData, fileName } = req.body;

    if (!tenancyId || !documentType || !fileData || !fileName) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "tenancyId, documentType, fileData, and fileName are required",
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        error: "Server misconfiguration",
        message: "Missing SUPABASE credentials",
      });
    }

    // Create admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create unique file path
    const fileExt = fileName.split(".").pop();
    const timestamp = Date.now();
    const uniqueFileName = `${tenancyId}_${timestamp}.${fileExt}`;
    const filePath = `tenancy_${tenancyId}/${uniqueFileName}`;

    // Convert base64 data to Buffer
    const fileBuffer = Buffer.from(fileData, "base64");

    // Upload file to storage bucket
    const { error: uploadError, data: uploadData } =
      await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileBuffer, {
          contentType: "application/octet-stream",
          upsert: false,
        });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return res.status(500).json({
        error: "Upload failed",
        message: uploadError.message,
      });
    }

    // Get signed URL for download (1 hour expiration)
    const { data: signedUrlData, error: signedUrlError } =
      await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, 3600); // 3600 seconds = 1 hour

    if (signedUrlError) {
      console.error("Signed URL error:", signedUrlError);
      return res.status(500).json({
        error: "Failed to generate download URL",
        message: signedUrlError.message,
      });
    }

    // Return upload response with signed URL
    return res.json({
      success: true,
      message: "Document uploaded successfully",
      file: {
        fileName: uniqueFileName,
        filePath: filePath,
        fileSize: fileBuffer.length,
        downloadUrl: signedUrlData.signedUrl,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return res.status(500).json({
      error: "Upload failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Refresh a signed URL for an existing document
 * Call this endpoint when a signed URL expires
 */
export const handleRefreshSignedUrl: RequestHandler = async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({
        error: "Missing filePath",
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        error: "Server misconfiguration",
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: signedUrlData, error: signedUrlError } =
      await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, 3600); // 1 hour expiration

    if (signedUrlError) {
      return res.status(500).json({
        error: "Failed to generate signed URL",
        message: signedUrlError.message,
      });
    }

    return res.json({
      success: true,
      downloadUrl: signedUrlData.signedUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Refresh signed URL error:", error);
    return res.status(500).json({
      error: "Failed to refresh URL",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
