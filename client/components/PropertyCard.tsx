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
  const isTenantOccupied = !!property.tenancy;

  return (
    <Link to={`/property/${property.property_id}`}>
      <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer h-full flex flex-col">
        {/* Header with Address and Status Badge */}
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">
              {property.address}
            </h3>
            {property.details && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                {property.details}
              </p>
            )}
          </div>
          {/* Status Badge */}
          <div
            className={cn(
              'flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full text-white text-sm font-bold',
              statusColor.badge
            )}
          >
            {property.pending_count > 0 ? property.pending_count : '✓'}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Tenant Info Section */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Current Tenant
          </p>
          <p className={cn('text-base font-semibold mt-1',
            isTenantOccupied ? 'text-slate-900' : 'text-amber-600'
          )}>
            {tenantName}
          </p>
        </div>

        {/* Rent Status Indicator */}
        <div className="mt-4">
          <div
            className={cn(
              'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold',
              statusColor.bg,
              statusColor.text
            )}
          >
            {property.pending_count === 0 && isTenantOccupied
              ? '✓ All Paid'
              : property.pending_count > 0
                ? `⚠ ${property.pending_count} Pending`
                : '○ Vacant'}
          </div>
        </div>
      </div>
    </Link>
  );
}
