# Supabase Storage Setup for Tenancy Documents

To enable document management for tenancies, you need to create a storage bucket in Supabase.

## Steps to Create Storage Bucket:

1. **Login to Supabase Console**
   - Go to https://supabase.com
   - Open your project

2. **Navigate to Storage**
   - Click on "Storage" in the left sidebar
   - Click "Create a new bucket"

3. **Create Bucket**
   - **Bucket name**: `tenancy_documents`
   - **Public bucket**: Leave unchecked (we'll use RLS policies instead)
   - Click "Create bucket"

4. **Set Bucket Policies**
   After creating the bucket, set up the following RLS policies:
   - **Click on the bucket** → "Policies" tab
   - **Create a new policy** for SELECT (Download):

     ```
     Policy name: Allow public read on tenancy_documents
     Target roles: postgres (or anon if using public access)
     Allowed operation: SELECT
     USING condition: true
     ```

   - **Create a new policy** for INSERT (Upload):

     ```
     Policy name: Allow public insert on tenancy_documents
     Target roles: postgres (or anon if using public access)
     Allowed operation: INSERT
     WITH CHECK condition: true
     ```

   - **Create a new policy** for DELETE:
     ```
     Policy name: Allow public delete on tenancy_documents
     Target roles: postgres (or anon if using public access)
     Allowed operation: DELETE
     USING condition: true
     ```

## Verification

Once the bucket is created with the correct policies:

1. Navigate to Property Details page
2. You should see the "Tenancy Documents" section
3. Try uploading a document - it should work without errors

## Supported File Types

The following file types are supported:

- Documents: `.pdf`, `.doc`, `.docx`
- Images: `.jpg`, `.jpeg`, `.png`
- Spreadsheets: `.xlsx`, `.xls`

## Troubleshooting

If you get a "bucket not found" error:

- Make sure the bucket name is exactly `tenancy_documents`
- Verify the RLS policies are set to allow uploads/downloads
- Check that you're logged into the correct Supabase project

If uploads fail with permission errors:

- Go to the bucket's Policies tab
- Ensure the INSERT policy has `true` in the WITH CHECK condition
- Make sure the target roles include the role used by your application
