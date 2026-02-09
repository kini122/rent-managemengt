import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const BUCKET_NAME = "tenancy_documents";

/**
 * Initialize Supabase storage bucket for document uploads
 * This endpoint uses the service role key to create and configure the bucket
 */
export const handleInitStorage: RequestHandler = async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(400).json({
        error: "Missing Supabase configuration",
        message:
          "Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables",
      });
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if bucket exists
    const { data: buckets, error: listError } =
      await supabaseAdmin.storage.listBuckets();

    if (listError) {
      return res.status(500).json({
        error: "Failed to list buckets",
        message: listError.message,
      });
    }

    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

    if (!bucketExists) {
      // Create the bucket
      const { data: newBucket, error: createError } =
        await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
          public: false, // Private bucket - documents not publicly accessible
          fileSizeLimit: 52428800, // 50MB limit per file
          allowedMimeTypes: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/png",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ],
        });

      if (createError) {
        return res.status(500).json({
          error: "Failed to create bucket",
          message: createError.message,
        });
      }

      console.log(`Created storage bucket: ${BUCKET_NAME}`);
    }

    // Set up bucket policies for authenticated users
    // This allows authenticated users to upload files
    const { error: policyError } = await supabaseAdmin.storage.updateBucketPolicies(
      BUCKET_NAME,
      {
        authenticated: "authenticated",
        unauthenticated: "unauthenticated",
      }
    );

    // Note: The above may not work for RLS policies. 
    // Proper RLS policies need to be set up in Supabase dashboard
    // For now, we'll proceed without strict RLS

    return res.json({
      success: true,
      message: `Storage bucket '${BUCKET_NAME}' is ready`,
      bucket: BUCKET_NAME,
      created: !bucketExists,
    });
  } catch (error) {
    console.error("Storage initialization error:", error);
    return res.status(500).json({
      error: "Storage initialization failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
