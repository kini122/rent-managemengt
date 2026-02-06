import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { RentPayment } from '@/types/index';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Loader2, Edit2, Check, X } from 'lucide-react';
import { updateRentPayment } from '@/services/supabaseAdmin';
import { toast } from 'sonner';

export interface RentTableProps {
  payments: RentPayment[];
  onUpdateStatus?: (rentId: number, status: 'paid' | 'pending' | 'partial') => Promise<void>;
  onMarkPaid?: (rentId: number) => Promise<void>;
  onRefresh?: () => Promise<void>;
  isEditable?: boolean;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'paid':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', badge: 'emerald' };
    case 'partial':
      return { bg: 'bg-amber-100', text: 'text-amber-700', badge: 'amber' };
    default:
      return { bg: 'bg-red-100', text: 'text-red-700', badge: 'red' };
  }
}

export function RentTable({
  payments,
  onMarkPaid,
  onRefresh,
  isEditable = false,
}: RentTableProps) {
  const [loading, setLoading] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{
    [key: number]: { paid_date: string; remarks: string };
  }>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const handleEditClick = (payment: RentPayment) => {
    setEditingId(payment.rent_id);
    setEditData({
      [payment.rent_id]: {
        paid_date: payment.paid_date || '',
        remarks: payment.remarks || '',
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
        paid_date: data.paid_date || null,
        remarks: data.remarks,
      });

      toast.success('Payment details updated');
      setEditingId(null);
      setEditData({});
      await onRefresh?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update payment');
    } finally {
      setSavingId(null);
    }
  };

  const handleMarkPaid = async (rentId: number) => {
    setLoading(rentId);
    try {
      await onMarkPaid?.(rentId);
      await onRefresh?.();
    } finally {
      setLoading(null);
    }
  };

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
        <p className="text-slate-600">No rent payments found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Month</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Rent Amount
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Paid Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Remarks
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {payments.map((payment) => {
              const statusColor = getStatusColor(payment.payment_status);
              const monthDate = new Date(payment.rent_month);
              const monthStr = monthDate.toLocaleDateString('en-GB', {
                month: 'long',
                year: 'numeric',
              });
              const paidDateStr = payment.paid_date
                ? new Date(payment.paid_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : '-';

              const isEditing = editingId === payment.rent_id;

              return (
                <tr key={payment.rent_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{monthStr}</td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    ₹{payment.rent_amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <select
                        value={editData[payment.rent_id]?.status || payment.payment_status}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            [payment.rent_id]: {
                              ...editData[payment.rent_id],
                              status: e.target.value as 'paid' | 'pending' | 'partial',
                            },
                          })
                        }
                        className="w-full px-3 py-1 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                      </select>
                    ) : (
                      <span
                        className={cn(
                          'inline-block px-3 py-1 rounded-full text-xs font-medium capitalize',
                          statusColor.bg,
                          statusColor.text
                        )}
                      >
                        {payment.payment_status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
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
                        className="w-full"
                      />
                    ) : (
                      <span className="text-slate-600">{paidDateStr}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {isEditing ? (
                      <Input
                        type="text"
                        placeholder="Add remarks..."
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
                        className="w-full"
                      />
                    ) : (
                      <span className="text-slate-600 max-w-xs truncate block">
                        {payment.remarks || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(payment)}
                          disabled={savingId === payment.rent_id}
                          className="inline-flex items-center gap-1 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {savingId === payment.rent_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={savingId === payment.rent_id}
                          className="inline-flex items-center gap-1 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {isEditable && (
                          <button
                            onClick={() => handleEditClick(payment)}
                            className="inline-flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                        {isEditable && payment.payment_status !== 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkPaid(payment.rent_id)}
                            disabled={loading === payment.rent_id}
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          >
                            {loading === payment.rent_id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Marking...
                              </>
                            ) : (
                              'Mark Paid'
                            )}
                          </Button>
                        )}
                      </>
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
