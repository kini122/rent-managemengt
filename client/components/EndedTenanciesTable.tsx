import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Loader2, ChevronDown, ChevronUp, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { updateRentPayment } from '@/services/supabaseAdmin';
import type { Tenancy, Tenant, Property, RentPayment } from '@/types/index';

interface EndedTenancyRecord extends Tenancy {
  property: Property;
  tenant: Tenant;
}

export function EndedTenanciesTable() {
  const [tenancies, setTenancies] = useState<EndedTenancyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchEndedTenancies();
  }, []);

  const fetchEndedTenancies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenancies')
        .select('*, property:properties(*), tenant:tenants(*)')
        .not('end_date', 'is', null)
        .order('end_date', { ascending: false });

      if (error) throw error;
      setTenancies(data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch ended tenancies');
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpand = (tenancyId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(tenancyId)) {
      newExpanded.delete(tenancyId);
    } else {
      newExpanded.add(tenancyId);
    }
    setExpandedRows(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (tenancies.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
        <p className="text-slate-600">No ended tenancies yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-12 px-4 py-3 text-center"></th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 min-w-[150px]">
                Property
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 min-w-[140px]">
                Tenant
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 min-w-[100px]">
                Start Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 min-w-[100px]">
                End Date
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 min-w-[100px]">
                Monthly Rent
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900 min-w-[80px]">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {tenancies.map((tenancy) => (
              <EndedTenancyRow
                key={tenancy.tenancy_id}
                tenancy={tenancy}
                isExpanded={expandedRows.has(tenancy.tenancy_id)}
                onToggleExpand={() => toggleRowExpand(tenancy.tenancy_id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EndedTenancyRow({
  tenancy,
  isExpanded,
  onToggleExpand,
}: {
  tenancy: EndedTenancyRecord;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <>
      <tr className="hover:bg-slate-50 cursor-pointer" onClick={onToggleExpand}>
        <td className="w-12 px-4 py-4 text-center">
          <button className="inline-flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </td>
        <td className="px-4 py-4 text-sm font-medium text-slate-900 truncate">
          {tenancy.property?.address || '-'}
        </td>
        <td className="px-4 py-4 text-sm text-slate-600">
          <div className="font-medium text-slate-900">{tenancy.tenant?.name || '-'}</div>
          <div className="text-xs text-slate-500">{tenancy.tenant?.phone || '-'}</div>
        </td>
        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
          {new Date(tenancy.start_date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </td>
        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
          {tenancy.end_date
            ? new Date(tenancy.end_date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
            : '-'}
        </td>
        <td className="px-4 py-4 text-sm font-medium text-slate-900 text-right whitespace-nowrap">
          ₹{tenancy.monthly_rent.toLocaleString('en-IN')}
        </td>
        <td className="px-4 py-4 text-center">
          <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium whitespace-nowrap">
            {tenancy.status}
          </span>
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-slate-50 border-b border-slate-200">
          <td colSpan={7} className="px-4 py-4">
            <ExpandedTenancyDetails tenancyId={tenancy.tenancy_id} />
          </td>
        </tr>
      )}
    </>
  );
}

function ExpandedTenancyDetails({ tenancyId }: { tenancyId: number }) {
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{
    [key: number]: { paid_date: string; remarks: string; status?: 'paid' | 'pending' | 'partial' };
  }>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    fetchRentPayments();
  }, [tenancyId]);

  const fetchRentPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rent_payments')
        .select('*')
        .eq('tenancy_id', tenancyId)
        .order('rent_month', { ascending: false });

      if (error) throw error;
      setRentPayments(data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch rent payments');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (payment: RentPayment) => {
    setEditingId(payment.rent_id);
    setEditData({
      [payment.rent_id]: {
        paid_date: payment.paid_date || '',
        remarks: payment.remarks || '',
        status: payment.payment_status,
      },
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSaveEdit = async (payment: RentPayment) => {
    try {
      setSavingId(payment.rent_id);
      const data = editData[payment.rent_id];

      await updateRentPayment(payment.rent_id, {
        payment_status: data.status || payment.payment_status,
        paid_date: data.paid_date || null,
        remarks: data.remarks,
      });

      toast.success('Payment details updated');
      setEditingId(null);
      setEditData({});
      await fetchRentPayments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update payment');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (rentPayments.length === 0) {
    return <p className="text-slate-600 text-sm">No rent payment records</p>;
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-slate-900 text-sm">Rent Payment History</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-white border-b border-slate-300">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-700 min-w-[120px]">
                Month
              </th>
              <th className="px-4 py-2 text-right font-medium text-slate-700 min-w-[90px]">
                Amount
              </th>
              <th className="px-4 py-2 text-center font-medium text-slate-700 min-w-[80px]">
                Status
              </th>
              <th className="px-4 py-2 text-center font-medium text-slate-700 min-w-[100px]">
                Paid Date
              </th>
              <th className="px-4 py-2 text-left font-medium text-slate-700 min-w-[100px]">
                Remarks
              </th>
              <th className="px-4 py-2 text-center font-medium text-slate-700 min-w-[80px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rentPayments.map((payment) => {
              const isEditing = editingId === payment.rent_id;
              const paidDateStr = payment.paid_date
                ? new Date(payment.paid_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : '-';

              return (
                <tr key={payment.rent_id} className="hover:bg-white">
                  <td className="px-4 py-2 text-slate-900 font-medium">
                    {new Date(payment.rent_month).toLocaleDateString('en-GB', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-900 text-right">
                    ₹{payment.rent_amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        payment.payment_status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : payment.payment_status === 'partial'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {payment.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editData[payment.rent_id]?.paid_date || ''}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            [payment.rent_id]: {
                              ...editData[payment.rent_id],
                              paid_date: e.target.value,
                            },
                          })
                        }
                        className="w-full text-xs"
                      />
                    ) : (
                      <span className="text-slate-600 text-xs whitespace-nowrap">
                        {paidDateStr}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {isEditing ? (
                      <Input
                        type="text"
                        placeholder="Remarks..."
                        value={editData[payment.rent_id]?.remarks || ''}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            [payment.rent_id]: {
                              ...editData[payment.rent_id],
                              remarks: e.target.value,
                            },
                          })
                        }
                        className="w-full text-xs"
                      />
                    ) : (
                      <span className="text-slate-600 text-xs truncate block">
                        {payment.remarks || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center space-x-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(payment)}
                          disabled={savingId === payment.rent_id}
                          className="inline-flex items-center justify-center w-6 h-6 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                          title="Save"
                        >
                          {savingId === payment.rent_id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={savingId === payment.rent_id}
                          className="inline-flex items-center justify-center w-6 h-6 text-slate-600 hover:bg-slate-100 rounded transition-colors disabled:opacity-50"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEditClick(payment)}
                        className="inline-flex items-center justify-center w-6 h-6 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
