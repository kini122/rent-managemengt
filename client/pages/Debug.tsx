import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Copy, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function Debug() {
  const [testResults, setTestResults] = useState<{
    supabaseUrl: string | null;
    supabaseKey: string | null;
    bucketExists: boolean | null;
    tablesExist: {
      properties: boolean;
      tenants: boolean;
      tenancies: boolean;
      rent_payments: boolean;
      tenancy_documents: boolean;
    } | null;
    rlsStatus: {
      [key: string]: boolean;
    } | null;
    error: string | null;
  }>({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || null,
    supabaseKey: import.meta.env.VITE_SUPABASE_KEY ? '***' : null,
    bucketExists: null,
    tablesExist: null,
    rlsStatus: null,
    error: null,
  });

  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    try {
      const results: any = {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || null,
        supabaseKey: import.meta.env.VITE_SUPABASE_KEY ? '***' : null,
        bucketExists: null,
        tablesExist: null,
        rlsStatus: null,
        error: null,
      };

      // Test 1: Check bucket
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        results.bucketExists = buckets?.some((b) => b.name === 'tenancy_documents') || false;
      } catch (err) {
        results.error = `Bucket check failed: ${err instanceof Error ? err.message : String(err)}`;
      }

      // Test 2: Check tables by trying to query them
      const tables = ['properties', 'tenants', 'tenancies', 'rent_payments', 'tenancy_documents'];
      results.tablesExist = {};

      for (const table of tables) {
        try {
          const { error } = await supabase.from(table).select('*').limit(1);
          results.tablesExist[table] = !error || !error.message.includes('not found');
        } catch (err) {
          results.tablesExist[table] = false;
        }
      }

      setTestResults(results);
      toast.success('Diagnostics complete');
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      toast.error('Diagnostics failed');
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    // Auto-run diagnostics on load
    runDiagnostics();
  }, []);

  const allGood =
    testResults.supabaseUrl &&
    testResults.supabaseKey &&
    testResults.bucketExists &&
    Object.values(testResults.tablesExist || {}).every((v) => v === true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {allGood ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              )}
              <h1 className="text-2xl font-bold text-slate-900">
                {allGood ? 'System Ready' : 'Setup Status'}
              </h1>
            </div>
            <Button onClick={runDiagnostics} disabled={testing} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Testing...' : 'Re-test'}
            </Button>
          </div>

          <div className="space-y-6">
            {/* Configuration Status */}
            <div>
              <h2 className="font-semibold text-slate-900 mb-3">Environment Configuration</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                  <div className={`w-3 h-3 rounded-full ${testResults.supabaseUrl ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div className="flex-1">
                    <p className="font-mono text-sm text-slate-700">VITE_SUPABASE_URL</p>
                    <p className="text-xs text-slate-600">
                      {testResults.supabaseUrl || 'Not configured'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                  <div className={`w-3 h-3 rounded-full ${testResults.supabaseKey ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div className="flex-1">
                    <p className="font-mono text-sm text-slate-700">VITE_SUPABASE_KEY</p>
                    <p className="text-xs text-slate-600">
                      {testResults.supabaseKey ? 'Configured (hidden)' : 'Not configured'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Status */}
            <div>
              <h2 className="font-semibold text-slate-900 mb-3">Storage</h2>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                <div
                  className={`w-3 h-3 rounded-full ${
                    testResults.bucketExists ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                />
                <div>
                  <p className="font-mono text-sm text-slate-700">tenancy_documents Bucket</p>
                  <p className="text-xs text-slate-600">
                    {testResults.bucketExists ? 'Exists ✓' : 'Not found (will auto-create)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Database Tables Status */}
            <div>
              <h2 className="font-semibold text-slate-900 mb-3">Database Tables</h2>
              <div className="grid grid-cols-2 gap-3">
                {testResults.tablesExist &&
                  Object.entries(testResults.tablesExist).map(([table, exists]) => (
                    <div
                      key={table}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-200"
                    >
                      <div className={`w-3 h-3 rounded-full ${exists ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="font-mono text-sm text-slate-700">{table}</p>
                        <p className="text-xs text-slate-600">{exists ? 'Ready' : 'Missing'}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Error Message */}
            {testResults.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-900 mb-1">Error Detected</p>
                <p className="text-red-800 text-sm font-mono break-all">{testResults.error}</p>
              </div>
            )}

            {/* Success Message */}
            {allGood && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Everything is Ready!</h3>
                <p className="text-green-800 text-sm">
                  Your database is properly configured. You can now:
                </p>
                <ul className="text-green-800 text-sm space-y-1 mt-2 ml-4">
                  <li>✓ Create and manage properties</li>
                  <li>✓ Add and update tenants</li>
                  <li>✓ Create tenancies</li>
                  <li>✓ Track rent payments</li>
                  <li>✓ Upload tenant documents</li>
                </ul>
              </div>
            )}

            {/* Fix Instructions */}
            {!allGood && (
              <div className="space-y-3">
                <h2 className="font-semibold text-slate-900">Required Actions</h2>

                {(!testResults.tablesExist ||
                  Object.values(testResults.tablesExist).some((v) => !v)) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="font-semibold text-amber-900 mb-2">Missing Database Tables</p>
                    <p className="text-amber-800 text-sm mb-3">
                      Run this SQL in your Supabase dashboard:
                    </p>
                    <div className="bg-white rounded border border-amber-200 p-3 font-mono text-xs overflow-x-auto mb-3">
                      <pre className="text-slate-700">{`-- Disable RLS on all tables
ALTER TABLE IF EXISTS properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenancies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rent_payments DISABLE ROW LEVEL SECURITY;

-- Create missing tenancy_documents table
CREATE TABLE IF NOT EXISTS tenancy_documents (
  document_id BIGSERIAL PRIMARY KEY,
  tenancy_id BIGINT NOT NULL REFERENCES tenancies(tenancy_id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  document_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenancy_documents_tenancy_id 
  ON tenancy_documents(tenancy_id);

ALTER TABLE tenancy_documents DISABLE ROW LEVEL SECURITY;`}</pre>
                    </div>
                    <Button
                      onClick={() => {
                        const sql = `-- Disable RLS on all tables
ALTER TABLE IF EXISTS properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenancies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rent_payments DISABLE ROW LEVEL SECURITY;

-- Create missing tenancy_documents table
CREATE TABLE IF NOT EXISTS tenancy_documents (
  document_id BIGSERIAL PRIMARY KEY,
  tenancy_id BIGINT NOT NULL REFERENCES tenancies(tenancy_id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  document_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenancy_documents_tenancy_id 
  ON tenancy_documents(tenancy_id);

ALTER TABLE tenancy_documents DISABLE ROW LEVEL SECURITY;`;
                        navigator.clipboard.writeText(sql);
                        toast.success('SQL copied to clipboard');
                      }}
                      className="gap-2 bg-amber-600 hover:bg-amber-700"
                    >
                      <Copy className="w-4 h-4" />
                      Copy SQL
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
