import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import type { Tenancy, Tenant, Property, RentPayment } from '@/types/index';

interface EndedTenancyRecord extends Tenancy {
  property: Property;
  tenant: Tenant;
}

interface ExpandedRow {
  tenancyId: number;
  rentPayments: RentPayment[];
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
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-10 px-6 py-3"></th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Property
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Tenant
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                End Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Monthly Rent
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {tenancies.map((tenancy) => (
              <tbody key={tenancy.tenancy_id}>
                <tr
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => toggleRowExpand(tenancy.tenancy_id)}
                >
                  <td className="px-6 py-4">
                    <button className="text-slate-400 hover:text-slate-600">
                      {expandedRows.has(tenancy.tenancy_id) ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {tenancy.property?.address || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div>{tenancy.tenant?.name || '-'}</div>
                    <div className="text-xs text-slate-500">{tenancy.tenant?.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(tenancy.start_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {tenancy.end_date ? new Date(tenancy.end_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    ₹{tenancy.monthly_rent.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                      {tenancy.status}
                    </span>
                  </td>
                </tr>

                {expandedRows.has(tenancy.tenancy_id) && (
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <td colSpan={7} className="px-6 py-4">
                      <ExpandedTenancyDetails tenancyId={tenancy.tenancy_id} />
                    </td>
                  </tr>
                )}
              </tbody>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpandedTenancyDetails({ tenancyId }: { tenancyId: number }) {
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (rentPayments.length === 0) {
    return <p className="text-slate-600 text-sm">No rent payment records</p>;
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-slate-900">Rent Payment History</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white border-b border-slate-300">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-700">Month</th>
              <th className="px-4 py-2 text-left font-medium text-slate-700">Amount</th>
              <th className="px-4 py-2 text-left font-medium text-slate-700">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slate-700">Paid Date</th>
              <th className="px-4 py-2 text-left font-medium text-slate-700">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rentPayments.map((payment) => (
              <tr key={payment.rent_id} className="hover:bg-white">
                <td className="px-4 py-2 text-slate-900">
                  {new Date(payment.rent_month).toLocaleDateString('en-IN', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-2 font-medium text-slate-900">
                  ₹{payment.rent_amount.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
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
                <td className="px-4 py-2 text-slate-600">
                  {payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-2 text-slate-600">{payment.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
