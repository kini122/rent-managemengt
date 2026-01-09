import { Link } from 'react-router-dom';
import type { PropertyWithTenant } from '@/types/index';
import { cn } from '@/lib/utils';

export interface PropertyCardProps {
  property: PropertyWithTenant;
}

function getStatusColor(pendingCount: number) {
  if (pendingCount === 0) return { bg: 'bg-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-500' };
  if (pendingCount === 1) return { bg: 'bg-amber-100', text: 'text-amber-700', badge: 'bg-amber-500' };
  return { bg: 'bg-red-100', text: 'text-red-700', badge: 'bg-red-500' };
}

export function PropertyCard({ property }: PropertyCardProps) {
  const tenantName = property.tenancy?.tenant?.name || 'Vacant';
  const statusColor = getStatusColor(property.pending_count);

  return (
    <Link to={`/property/${property.property_id}`}>
      <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer h-full">
        {/* Status Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{property.address}</h3>
            <p className="text-sm text-slate-500 mt-1">
              {property.details && `${property.details.substring(0, 40)}...`}
            </p>
          </div>
          <div
            className={cn(
              'inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold',
              statusColor.badge
            )}
          >
            {property.pending_count > 0 ? property.pending_count : '✓'}
          </div>
        </div>

        {/* Tenant Info */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-600">Current Tenant</p>
          <p className="text-base font-medium text-slate-900 mt-1">{tenantName}</p>
        </div>

        {/* Rent Status Indicator */}
        <div className="mt-4">
          <div
            className={cn(
              'inline-block px-3 py-1 rounded-full text-xs font-medium',
              statusColor.bg,
              statusColor.text
            )}
          >
            {property.pending_count === 0
              ? '✓ All Rents Paid'
              : `⚠ ${property.pending_count} Rent${property.pending_count > 1 ? 's' : ''} Pending`}
          </div>
        </div>
      </div>
    </Link>
  );
}
