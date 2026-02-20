import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const BUCKET_NAME = "tenancy_documents";

/**
 * Secure document upload endpoint
 * Uses service role key for backend authentication - no RLS issues
 * Returns signed URL for secure file access
 */
// Map file extensions to MIME types
function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const mimeTypes: Record<string, string> = {
    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    // Text
    txt: "text/plain",
    csv: "text/csv",
    // Default
    default: "application/octet-stream",
  };

  return mimeTypes[ext] || mimeTypes.default;
}

export const handleDocumentUpload: RequestHandler = async (req, res) => {
  try {
    const { tenancyId, documentType, fileData, fileName, fileType } = req.body;

    if (!tenancyId || !documentType || !fileData || !fileName) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "tenancyId, documentType, fileData, and fileName are required",
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.VITE_SUPABASE_KEY;

    if (!supabaseUrl) {
      return res.status(500).json({
        error: "Server misconfiguration",
        message: "Missing VITE_SUPABASE_URL",
      });
    }

    // Use service key if available, otherwise fallback to anon key
    const clientKey = supabaseServiceKey || supabaseAnonKey;

    if (!clientKey) {
      return res.status(500).json({
        error: "Server misconfiguration",
        message: "Missing SUPABASE credentials",
      });
    }

    if (!supabaseServiceKey) {
      console.warn("Using anon key for upload. Ensure RLS policies are set for bucket 'tenancy_documents'.");
    }

    // Create client (uses service role key to bypass RLS if available)
    const supabaseClient = createClient(supabaseUrl, clientKey);

    // Create unique file path
    const fileExt = fileName.split(".").pop();
    const timestamp = Date.now();
    const uniqueFileName = `${tenancyId}_${timestamp}.${fileExt}`;
    const filePath = `tenancy_${tenancyId}/${uniqueFileName}`;

    // Convert base64 data to Buffer
    const fileBuffer = Buffer.from(fileData, "base64");

    // Determine correct MIME type (from client if provided, otherwise from extension)
    const contentType = fileType || getMimeType(fileName);

    // Upload file to storage bucket
    const { error: uploadError, data: uploadData } =
      await supabaseClient.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileBuffer, {
          contentType,
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
      await supabaseClient.storage
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
    const supabaseAnonKey = process.env.VITE_SUPABASE_KEY;

    if (!supabaseUrl) {
      return res.status(500).json({
        error: "Server misconfiguration",
      });
    }

    const clientKey = supabaseServiceKey || supabaseAnonKey;
    if (!clientKey) {
      return res.status(500).json({
        error: "Missing credentials",
      });
    }

    const supabaseClient = createClient(supabaseUrl, clientKey);

    const { data: signedUrlData, error: signedUrlError } =
      await supabaseClient.storage
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
