import { Link } from 'react-router-dom';
import { useProperties } from '@/hooks/useSupabase';
import { PropertyCard } from '@/components/PropertyCard';
import { isRLSError } from '@/lib/rls-check';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, AlertCircle, BookOpen } from 'lucide-react';

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
            <div className="flex gap-2">
              <Link to="/guideline">
                <Button variant="ghost" className="gap-2 text-slate-600">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Guidelines</span>
                </Button>
              </Link>
              <Link to="/admin">
                <Button className="gap-2">
                  <Settings className="w-4 h-4" />
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className={`mb-6 p-4 rounded-lg border ${
            isRLSError(error)
              ? 'bg-red-50 border-red-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex gap-3">
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                isRLSError(error) ? 'text-red-600' : 'text-red-600'
              }`} />
              <div className="flex-1">
                <p className={`font-medium ${
                  isRLSError(error) ? 'text-red-900' : 'text-red-700'
                }`}>
                  {isRLSError(error) ? 'Database Security Issue' : 'Error'}
                </p>
                <p className={`text-sm mt-1 ${
                  isRLSError(error) ? 'text-red-800' : 'text-red-600'
                }`}>
                  {error}
                </p>
                {isRLSError(error) && (
                  <div className="mt-4 flex gap-2">
                    <p className="text-sm text-red-700 italic">
                      Please contact your administrator to configure database security.
                    </p>
                  </div>
                )}
              </div>
            </div>
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
