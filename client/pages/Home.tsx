import { Link } from 'react-router-dom';
import { useProperties } from '@/hooks/useSupabase';
import { PropertyCard } from '@/components/PropertyCard';
import { isConfigured } from '@/lib/supabaseClient';
import { isRLSError } from '@/lib/rls-check';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, AlertCircle } from 'lucide-react';

export default function Home() {
  const { properties, loading, error } = useProperties();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Rent Management System</h1>
              <p className="text-slate-600 mt-1">Manage your properties and track rent payments</p>
            </div>
            <Link to="/admin">
              <Button className="gap-2">
                <Settings className="w-4 h-4" />
                Admin Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConfigured && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 font-medium">
              ⚠️ Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_KEY environment variables.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">Error: {error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            <span className="ml-3 text-slate-600">Loading properties...</span>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">No Properties Found</h2>
            <p className="text-slate-600">Create your first property to get started</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <p className="text-slate-600 text-sm font-medium">Total Properties</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{properties.length}</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <p className="text-slate-600 text-sm font-medium">Occupied</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {properties.filter(p => p.tenancy).length}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <p className="text-slate-600 text-sm font-medium">Pending Rents</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {properties.reduce((sum, p) => sum + p.pending_count, 0)}
                </p>
              </div>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.property_id} property={property} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
