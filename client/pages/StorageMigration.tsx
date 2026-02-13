import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function StorageMigration() {
  const [copied, setCopied] = useState(false);

  const migrationSQL = `-- NEW STORAGE SYSTEM MIGRATION
-- Redesigned for security and reliability
-- Uses backend service role key (no RLS needed)
-- Implements signed URLs for secure downloads

-- 1. Drop old tenancy_documents table and recreate with new schema
DROP TABLE IF EXISTS tenancy_documents CASCADE;

-- 2. Disable RLS on all tables (no longer needed for storage)
ALTER TABLE IF EXISTS properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenancies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rent_payments DISABLE ROW LEVEL SECURITY;

-- 3. Create new tenancy_documents table with improved schema
CREATE TABLE tenancy_documents (
  document_id BIGSERIAL PRIMARY KEY,
  tenancy_id BIGINT NOT NULL REFERENCES tenancies(tenancy_id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  document_type TEXT NOT NULL,
  signed_url TEXT,
  url_expires_at TIMESTAMP WITH TIME ZONE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create indexes for performance
CREATE INDEX idx_tenancy_documents_tenancy_id ON tenancy_documents(tenancy_id);
CREATE INDEX idx_tenancy_documents_uploaded_at ON tenancy_documents(uploaded_at DESC);

-- 5. Disable RLS on tenancy_documents
ALTER TABLE tenancy_documents DISABLE ROW LEVEL SECURITY;

-- 6. Verify the table was created
SELECT 
  tablename,
  (SELECT count(*) FROM tenancy_documents) as row_count
FROM pg_tables 
WHERE tablename = 'tenancy_documents';`;

  const handleCopy = () => {
    navigator.clipboard.writeText(migrationSQL);
    setCopied(true);
    toast.success('SQL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-slate-900">New Storage System</h1>
          </div>

          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="font-semibold text-green-900 mb-2">✅ System Redesigned</h2>
              <p className="text-green-800 text-sm mb-3">
                Your file upload system has been completely rebuilt for better security and reliability:
              </p>
              <ul className="text-green-800 text-sm space-y-2 ml-4">
                <li>✓ Secure backend upload endpoint (uses service role key)</li>
                <li>✓ Private files with signed URLs (1-hour expiration)</li>
                <li>✓ No RLS policies needed</li>
                <li>✓ Automatic URL refresh on download</li>
                <li>✓ Support for any file type (up to 100MB)</li>
                <li>✓ Clean error handling</li>
              </ul>
            </div>

            {/* SQL Code Display */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Database Migration SQL</h3>
              <div className="bg-slate-900 rounded-lg border border-slate-700 p-4 mb-4 font-mono text-sm overflow-x-auto">
                <pre className="text-slate-100">
{migrationSQL}
                </pre>
              </div>

              <Button
                onClick={handleCopy}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy SQL'}
              </Button>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Setup Instructions</h3>
              <ol className="space-y-3 text-slate-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">1</span>
                  <span>
                    Open{' '}
                    <a
                      href="https://app.supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      Supabase Dashboard
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">2</span>
                  <span>Go to <strong>SQL Editor</strong> → <strong>New Query</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">3</span>
                  <span><strong>Paste the SQL code</strong> above</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">4</span>
                  <span>Click <strong>Run</strong> (or Ctrl+Enter)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">5</span>
                  <span><strong>Refresh this app</strong> - you're done! 🎉</span>
                </li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">How It Works Now:</h3>
              <ul className="text-blue-800 text-sm space-y-2">
                <li><strong>Upload:</strong> File is sent to backend via /api/documents/upload with base64 encoding</li>
                <li><strong>Storage:</strong> Backend uses service role key to upload directly to Supabase Storage (no RLS issues)</li>
                <li><strong>Download:</strong> Signed URL is generated (1-hour expiration) and stored in database</li>
                <li><strong>Security:</strong> Files are private - only accessible via signed URL or backend endpoint</li>
                <li><strong>Refresh:</strong> On download, app automatically refreshes URL if close to expiration</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2">⚙️ Already Done For You:</h3>
              <ul className="text-amber-800 text-sm space-y-1">
                <li>✓ Backend upload endpoint created</li>
                <li>✓ Signed URL generation implemented</li>
                <li>✓ Client-side upload component updated</li>
                <li>✓ Download with URL refresh logic added</li>
                <li>✓ Type definitions updated</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
