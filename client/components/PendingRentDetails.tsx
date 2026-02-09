import type { RentPayment } from '@/types/index';
import { AlertCircle } from 'lucide-react';

export interface PendingRentDetailsProps {
  payments: RentPayment[];
}

export function PendingRentDetails({ payments }: PendingRentDetailsProps) {
  const pendingAndPartialPayments = payments.filter(
    (payment) => payment.payment_status === 'pending' || payment.payment_status === 'partial'
  );

  if (pendingAndPartialPayments.length === 0) {
    return null;
  }

  // Calculate total amount
  const totalAmount = pendingAndPartialPayments.reduce((sum, payment) => {
    if (payment.payment_status === 'partial' && payment.remarks) {
      // Extract remaining amount from remarks if it exists
      const match = payment.remarks.match(/Remaining:\s*₹?([\d,]+)/);
      if (match) {
        return sum + parseInt(match[1].replace(/,/g, ''), 10);
      }
    }
    return sum + payment.rent_amount;
  }, 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <h3 className="text-lg font-bold text-slate-900">Pending & Partial Rent Details</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Month</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                Rent Amount
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                Outstanding
              </th>
            </tr>
          </thead>
          <tbody>
            {pendingAndPartialPayments.map((payment, index) => {
              let outstandingAmount = payment.rent_amount;

              if (payment.payment_status === 'partial' && payment.remarks) {
                // Extract remaining/outstanding amount from remarks
                const match = payment.remarks.match(/Remaining:\s*₹?([\d,]+)/);
                if (match) {
                  outstandingAmount = parseInt(match[1].replace(/,/g, ''), 10);
                }
              }

              return (
                <tr
                  key={payment.rent_id}
                  className={`border-b border-slate-100 ${
                    index % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                  }`}
                >
                  <td className="px-6 py-3 text-sm text-slate-900 font-medium whitespace-nowrap">
                    {new Date(payment.rent_month).toLocaleDateString('en-GB', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        payment.payment_status === 'pending'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {payment.payment_status === 'pending' ? 'Pending' : 'Partial'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-right text-slate-900 font-medium">
                    ₹{payment.rent_amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-semibold">
                    <span className="text-red-600">
                      ₹{outstandingAmount.toLocaleString('en-IN')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 border-t-2 border-slate-200">
            <tr>
              <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold text-slate-900">
                Total Outstanding:
              </td>
              <td className="px-6 py-3 text-right text-sm font-bold text-red-600">
                ₹{totalAmount.toLocaleString('en-IN')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
