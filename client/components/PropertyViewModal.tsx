import { X, Building2, User, Phone, Calendar, Banknote } from 'lucide-react';
import type { PropertyWithTenant } from '@/types/index';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface PropertyViewModalProps {
  property: PropertyWithTenant;
  onClose: () => void;
}

export function PropertyViewModal({ property, onClose }: PropertyViewModalProps) {
  const isOccupied = !!property.tenancy;
  const t = property.tenancy;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return '-';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 truncate pr-4">{property.address}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider",
                  isOccupied ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                )}>
                  {isOccupied ? "Occupied" : "Vacant"}
                </span>
                {property.pending_count > 0 && (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 tracking-wider">
                     <span className="uppercase">{property.pending_count} Pending</span>
                     {property.pending_months && property.pending_months.length > 0 && (
                       <span className="ml-1 normal-case font-medium">
                         ({property.pending_months.map(m => {
                           if (!m || !m.includes('-')) return m;
                           const [year, month] = m.split('-');
                           return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-GB', { month: 'short', year: '2-digit' });
                         }).join(', ')})
                       </span>
                     )}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0 self-start"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto w-full">
          <div className="p-5 md:p-6 space-y-6">
            
            {/* Property Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Property Details</h3>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs text-slate-500 mb-1">Address</span>
                    <span className="text-sm font-medium text-slate-900">{property.address}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 mb-1">Description</span>
                    <span className="text-sm font-medium text-slate-900">{property.details || 'No details provided'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tenant Overview */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Tenant Overview</h3>
              {isOccupied && t?.tenant ? (
                <div className="bg-white border text-sm border-slate-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    <div className="p-4 flex items-start gap-3">
                      <User className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <span className="block text-xs text-slate-500 mb-0.5">Name</span>
                        <span className="font-semibold text-slate-900">{t.tenant.name}</span>
                      </div>
                    </div>
                    <div className="p-4 flex items-start gap-3">
                      <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <span className="block text-xs text-slate-500 mb-0.5">Phone</span>
                        <span className="font-medium text-slate-900">{t.tenant.phone || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 text-slate-500 text-sm p-4 rounded-lg border border-slate-100 text-center italic">
                  No active tenant currently assigned to this property.
                </div>
              )}
            </div>

            {/* Tenancy Agreement Details */}
            {isOccupied && t && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Tenancy Terms</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <Calendar className="w-4 h-4 text-slate-400 mb-2" />
                    <span className="block text-xs text-slate-500">Start Date</span>
                    <span className="text-sm font-medium text-slate-900 mt-0.5 block">{formatDate(t.start_date)}</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <Calendar className="w-4 h-4 text-slate-400 mb-2" />
                    <span className="block text-xs text-slate-500">End Date</span>
                    <span className="text-sm font-medium text-slate-900 mt-0.5 block">{t.end_date ? formatDate(t.end_date) : 'Active'}</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <Banknote className="w-4 h-4 text-emerald-500 mb-2" />
                    <span className="block text-xs text-slate-500">Monthly Rent</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">{formatCurrency(t.monthly_rent)}</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <Banknote className="w-4 h-4 text-slate-400 mb-2" />
                    <span className="block text-xs text-slate-500">Advance Paid</span>
                    <span className="text-sm font-semibold text-slate-900 mt-0.5 block">{formatCurrency(t.advance_amount)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
