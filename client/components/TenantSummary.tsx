import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Property, Tenancy, Tenant } from '@/types/index';
import { useState } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { updateTenant, updateTenancy, endTenancy } from '@/services/supabaseAdmin';

export interface TenantSummaryProps {
  property: Property;
  tenancy?: (Tenancy & { tenant: Tenant }) | null;
  pendingRentCount?: number;
  pendingRentAmount?: number;
  onEdit?: () => void;
  onCreateTenancy?: () => void;
  onTenancyEnded?: () => void;
}

export function TenantSummary({
  property,
  tenancy,
  pendingRentCount = 0,
  pendingRentAmount = 0,
  onEdit,
  onCreateTenancy,
  onTenancyEnded,
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

  const handleEndTenancy = async () => {
    if (!confirm('Are you sure you want to end this tenancy? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSaving(true);
      await endTenancy(tenancy!.tenancy_id);
      toast.success('Tenancy ended successfully');
      onTenancyEnded?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to end tenancy');
    } finally {
      setIsSaving(false);
    }
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
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Edit
              </button>
              {tenancy.status === 'active' && (
                <button
                  onClick={handleEndTenancy}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  End Tenancy
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tenant Info */}
        <div>
          <label className="text-sm font-medium text-slate-600">Tenant Name</label>
          {isEditing ? (
            <Input
              type="text"
              value={editData.tenantName}
              onChange={(e) => setEditData({ ...editData, tenantName: e.target.value })}
              className="mt-1"
            />
          ) : (
            <p className="text-lg font-semibold text-slate-900 mt-1">{tenancy.tenant.name}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600">Phone</label>
          {isEditing ? (
            <Input
              type="tel"
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              className="mt-1"
            />
          ) : (
            <p className="text-lg font-semibold text-slate-900 mt-1">{tenancy.tenant.phone}</p>
          )}
        </div>

        {/* Tenancy Info */}
        <div>
          <label className="text-sm font-medium text-slate-600">Start Date</label>
          {isEditing ? (
            <Input
              type="date"
              value={editData.startDate}
              onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
              className="mt-1"
            />
          ) : (
            <p className="text-lg font-semibold text-slate-900 mt-1">
              {new Date(tenancy.start_date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600">Status</label>
          {isEditing ? (
            <select
              value={editData.status}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  status: e.target.value as 'active' | 'completed' | 'terminated',
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="terminated">Terminated</option>
            </select>
          ) : (
            <div className="mt-1">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                {tenancy.status}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600">Monthly Rent</label>
          {isEditing ? (
            <Input
              type="number"
              value={editData.monthlyRent}
              onChange={(e) => setEditData({ ...editData, monthlyRent: e.target.value })}
              className="mt-1"
            />
          ) : (
            <p className="text-lg font-semibold text-slate-900 mt-1">
              ₹{tenancy.monthly_rent.toLocaleString('en-IN')}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600">Advance Amount</label>
          {isEditing ? (
            <Input
              type="number"
              value={editData.advanceAmount}
              onChange={(e) => setEditData({ ...editData, advanceAmount: e.target.value })}
              className="mt-1"
            />
          ) : (
            <p className="text-lg font-semibold text-slate-900 mt-1">
              ₹{tenancy.advance_amount.toLocaleString('en-IN')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
