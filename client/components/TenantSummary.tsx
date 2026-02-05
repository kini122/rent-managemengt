import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Property, Tenancy, Tenant } from '@/types/index';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateTenant, updateTenancy } from '@/services/supabaseAdmin';

export interface TenantSummaryProps {
  property: Property;
  tenancy?: (Tenancy & { tenant: Tenant }) | null;
  onEdit?: () => void;
  onCreateTenancy?: () => void;
}

export function TenantSummary({
  property,
  tenancy,
  onEdit,
  onCreateTenancy,
}: TenantSummaryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    tenantName: tenancy?.tenant.name || '',
    phone: tenancy?.tenant.phone || '',
    startDate: tenancy?.start_date || '',
    status: tenancy?.status || 'active',
    monthlyRent: tenancy?.monthly_rent.toString() || '',
    advanceAmount: tenancy?.advance_amount.toString() || '',
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Update tenant
      if (editData.tenantName !== tenancy?.tenant.name || editData.phone !== tenancy?.tenant.phone) {
        await updateTenant(tenancy!.tenant.tenant_id, {
          name: editData.tenantName,
          phone: editData.phone,
        });
      }

      // Update tenancy
      if (
        editData.monthlyRent !== tenancy?.monthly_rent.toString() ||
        editData.advanceAmount !== tenancy?.advance_amount.toString() ||
        editData.status !== tenancy?.status ||
        editData.startDate !== tenancy?.start_date
      ) {
        await updateTenancy(tenancy!.tenancy_id, {
          monthly_rent: parseFloat(editData.monthlyRent),
          advance_amount: parseFloat(editData.advanceAmount),
          status: editData.status as 'active' | 'completed' | 'terminated',
          start_date: editData.startDate,
        });
      }

      toast.success('Tenancy details updated successfully');
      setIsEditing(false);
      onEdit?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      tenantName: tenancy?.tenant.name || '',
      phone: tenancy?.tenant.phone || '',
      startDate: tenancy?.start_date || '',
      status: tenancy?.status || 'active',
      monthlyRent: tenancy?.monthly_rent.toString() || '',
      advanceAmount: tenancy?.advance_amount.toString() || '',
    });
    setIsEditing(false);
  };

  if (!tenancy) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Property Vacant</h3>
          <p className="text-slate-600 mb-4">No active tenancy assigned to this property</p>
          <Button onClick={onCreateTenancy} className="bg-blue-600 hover:bg-blue-700">
            Create New Tenancy
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{property.address}</h2>
          <p className="text-slate-600 mt-1">{property.details}</p>
        </div>
        <button
          onClick={() => {
            setIsEditing(!isEditing);
            onEdit?.();
          }}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          {isEditing ? 'Done' : 'Edit'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tenant Info */}
        <div>
          <label className="text-sm font-medium text-slate-600">Tenant Name</label>
          <p className="text-lg font-semibold text-slate-900 mt-1">{tenancy.tenant.name}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600">Phone</label>
          <p className="text-lg font-semibold text-slate-900 mt-1">{tenancy.tenant.phone}</p>
        </div>

        {/* Tenancy Info */}
        <div>
          <label className="text-sm font-medium text-slate-600">Start Date</label>
          <p className="text-lg font-semibold text-slate-900 mt-1">
            {new Date(tenancy.start_date).toLocaleDateString()}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600">Status</label>
          <div className="mt-1">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
              {tenancy.status}
            </span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600">Monthly Rent</label>
          <p className="text-lg font-semibold text-slate-900 mt-1">
            ₹{tenancy.monthly_rent.toLocaleString('en-IN')}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600">Advance Amount</label>
          <p className="text-lg font-semibold text-slate-900 mt-1">
            ₹{tenancy.advance_amount.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
}
