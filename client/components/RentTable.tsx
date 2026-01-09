import { Button } from '@/components/ui/button';
import type { RentPayment } from '@/types/index';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export interface RentTableProps {
  payments: RentPayment[];
  onUpdateStatus?: (rentId: number, status: 'paid' | 'pending' | 'partial') => Promise<void>;
  onMarkPaid?: (rentId: number) => Promise<void>;
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

export function RentTable({ payments, onMarkPaid, isEditable = false }: RentTableProps) {
  const [loading, setLoading] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

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
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Rent Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Paid Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Remarks</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {payments.map((payment) => {
              const statusColor = getStatusColor(payment.payment_status);
              const monthDate = new Date(payment.rent_month);
              const monthStr = monthDate.toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric',
              });

              return (
                <tr key={payment.rent_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{monthStr}</td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    ₹{payment.rent_amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-block px-3 py-1 rounded-full text-xs font-medium capitalize',
                        statusColor.bg,
                        statusColor.text
                      )}
                    >
                      {payment.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {payment.paid_date
                      ? new Date(payment.paid_date).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                    {payment.remarks || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {isEditable && payment.payment_status !== 'paid' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          setLoading(payment.rent_id);
                          try {
                            await onMarkPaid?.(payment.rent_id);
                          } finally {
                            setLoading(null);
                          }
                        }}
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
