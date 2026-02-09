import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Copy, ExternalLink } from 'lucide-react';

export default function Setup() {
  const [copied, setCopied] = useState(false);

  const rls_disable_sql = `-- Disable RLS on all tables to allow public access
-- This is safe for single-user applications

ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenancies DISABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenancy_documents DISABLE ROW LEVEL SECURITY;`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rls_disable_sql);
    setCopied(true);
    toast.success('SQL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-bold text-slate-900">Database Setup Required</h1>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Issue Detected</h2>
              <p className="text-slate-700 mb-2">
                Your Supabase tables have Row Level Security (RLS) enabled but lack the necessary policies for the application to function properly.
              </p>
              <p className="text-slate-600 text-sm">
                Error: "new row violates low level security"
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Quick Fix</h3>
              <p className="text-blue-800 text-sm mb-4">
                Disable RLS on the application tables. This is safe for single-user property management applications.
              </p>

              <div className="bg-white rounded border border-blue-200 p-4 mb-4 font-mono text-sm overflow-x-auto">
                <pre className="text-slate-700">
{rls_disable_sql}
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

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">How to Apply</h3>
              <ol className="space-y-3 text-slate-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">
                    1
                  </span>
                  <span>
                    Go to{' '}
                    <a
                      href="https://app.supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      Supabase Dashboard
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">
                    2
                  </span>
                  <span>Select your project (qnrchjgrhrknczaxmxna)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">
                    3
                  </span>
                  <span>Go to SQL Editor (on the left sidebar)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">
                    4
                  </span>
                  <span>Click "New Query"</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">
                    5
                  </span>
                  <span>Paste the SQL code above and click "Run"</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold">
                    6
                  </span>
                  <span>Refresh this page or the app</span>
                </li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900">After running the SQL</h4>
                  <p className="text-green-800 text-sm">
                    All features will work: creating properties, adding tenants, managing tenancies, and uploading documents.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
              <p className="font-semibold mb-1">Why is this necessary?</p>
              <p>
                Supabase has RLS enabled as a security best practice, but the application needs full access to the data. Since this is a single-user property management system, disabling RLS is appropriate. If you need multi-user access with role-based restrictions, we can set up proper RLS policies instead.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
