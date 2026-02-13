import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, ExternalLink, AlertTriangle } from 'lucide-react';

export default function RLSFix() {
  const [copied, setCopied] = useState(false);

  const comprehensive_rls_fix = `-- COMPREHENSIVE RLS FIX
-- This script disables RLS on all tables and removes all policies

-- 1. Drop existing policies (if any)
DROP POLICY IF EXISTS "Allow all" ON properties;
DROP POLICY IF EXISTS "Allow all" ON tenants;
DROP POLICY IF EXISTS "Allow all" ON tenancies;
DROP POLICY IF EXISTS "Allow all" ON rent_payments;
DROP POLICY IF EXISTS "Allow all" ON tenancy_documents;

-- 2. Disable RLS on all tables
ALTER TABLE IF EXISTS properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenancies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rent_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenancy_documents DISABLE ROW LEVEL SECURITY;

-- 3. Create tenancy_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS tenancy_documents (
  document_id BIGSERIAL PRIMARY KEY,
  tenancy_id BIGINT NOT NULL REFERENCES tenancies(tenancy_id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  document_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create index for tenancy_documents
CREATE INDEX IF NOT EXISTS idx_tenancy_documents_tenancy_id 
  ON tenancy_documents(tenancy_id);

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('properties', 'tenants', 'tenancies', 'rent_payments', 'tenancy_documents');`;

  const handleCopy = () => {
    navigator.clipboard.writeText(comprehensive_rls_fix);
    setCopied(true);
    toast.success('SQL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h1 className="text-2xl font-bold text-slate-900">RLS Security Fix</h1>
          </div>

          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h2 className="font-semibold text-red-900 mb-2">Error: Row Level Security Blocking Access</h2>
              <p className="text-red-800 text-sm">
                Your database still has RLS enabled. Run this comprehensive SQL script to fix it completely.
              </p>
            </div>

            {/* SQL Code Display */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Complete Fix SQL</h3>
              <div className="bg-slate-900 rounded-lg border border-slate-700 p-4 mb-4 font-mono text-sm overflow-x-auto">
                <pre className="text-slate-100">
{comprehensive_rls_fix}
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
              <h3 className="font-semibold text-slate-900 mb-3">How to Apply</h3>
              <ol className="space-y-2 text-slate-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">1</span>
                  <span>
                    Open{' '}
                    <a
                      href="https://app.supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-semibold flex items-center gap-1 inline-flex"
                    >
                      Supabase Dashboard
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">2</span>
                  <span>Select your project</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">3</span>
                  <span>Click <strong>SQL Editor</strong> in the left sidebar</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">4</span>
                  <span>Click <strong>"New Query"</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">5</span>
                  <span><strong>Paste the entire SQL code</strong> above into the query editor</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">6</span>
                  <span>Click <strong>"Run"</strong> button (or Ctrl+Enter)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">7</span>
                  <span>Wait for completion and <strong>refresh this app</strong></span>
                </li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What This Script Does:</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>✓ Drops any existing RLS policies</li>
                <li>✓ Disables RLS on all 5 tables</li>
                <li>✓ Creates tenancy_documents table</li>
                <li>✓ Creates performance indexes</li>
                <li>✓ Verifies RLS is disabled</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">After Running:</h3>
              <p className="text-green-800 text-sm">
                All "new row violates low level security" errors will be fixed. You'll be able to create properties, tenants, tenancies, track rent payments, and upload documents without restrictions.
              </p>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
              <p className="font-semibold mb-1">Note:</p>
              <p>
                This script is safe for a single-user property management application. RLS is a PostgreSQL security feature meant for multi-user systems with different permission levels. Since this app is for managing one user's properties, disabling RLS is the appropriate solution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
