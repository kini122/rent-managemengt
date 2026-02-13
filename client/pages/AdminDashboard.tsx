import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { getDashboardMetrics } from '@/services/supabaseAdmin';
import { EndedTenanciesTable } from '@/components/EndedTenanciesTable';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, X } from 'lucide-react';
import type { Property, RentPayment, Tenancy, Tenant } from '@/types/index';

interface PendingRentRow {
  property: Property;
  tenant: Tenant;
  tenancy: Tenancy;
  payment: RentPayment;
}

interface PropertyWithStatus extends Property {
  occupied: boolean;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalProperties: 0,
    occupiedProperties: 0,
    vacantProperties: 0,
    totalTenants: 0,
    totalPendingRent: 0,
  });
  const [pendingRents, setPendingRents] = useState<PendingRentRow[]>([]);
  const [propertiesData, setPropertiesData] = useState<PropertyWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);

        // Get metrics
        const dashboardMetrics = await getDashboardMetrics();
        setMetrics(dashboardMetrics);

        // Get all properties with occupancy status
        const { data: propertiesData } = await supabase
          .from('properties')
          .select('*')
          .order('property_id', { ascending: false });

        if (propertiesData) {
          const { data: tenancies } = await supabase
            .from('tenancies')
            .select('property_id')
            .is('end_date', null);

          const occupiedIds = new Set(tenancies?.map(t => t.property_id) || []);

          setPropertiesData(
            propertiesData.map(p => ({
              ...p,
              occupied: occupiedIds.has(p.property_id),
            }))
          );
        }

        // Get pending rents with property and tenant details
        const { data, error: queryError } = await supabase
          .from('rent_payments')
          .select(`
            rent_id,
            rent_month,
            rent_amount,
            payment_status,
            paid_date,
            remarks,
            created_at,
            tenancy_id,
            tenancies!inner (
              tenancy_id,
              property_id,
              tenant_id,
              start_date,
              end_date,
              monthly_rent,
              advance_amount,
              status,
              created_at,
              properties!inner (
                property_id,
                address,
                details,
                is_active,
                created_at
              ),
              tenants!inner (
                tenant_id,
                name,
                phone,
                id_proof,
                notes,
                created_at
              )
            )
          `)
          .neq('payment_status', 'paid')
          .order('rent_month', { ascending: false });

        if (queryError) throw queryError;

        const formattedData: PendingRentRow[] = (data || []).map((item: any) => ({
          property: item.tenancies.properties,
          tenant: item.tenancies.tenants,
          tenancy: {
            tenancy_id: item.tenancies.tenancy_id,
            property_id: item.tenancies.property_id,
            tenant_id: item.tenancies.tenant_id,
            start_date: item.tenancies.start_date,
            end_date: item.tenancies.end_date,
            monthly_rent: item.tenancies.monthly_rent,
            advance_amount: item.tenancies.advance_amount,
            status: item.tenancies.status,
            created_at: item.tenancies.created_at,
          },
          payment: {
            rent_id: item.rent_id,
            tenancy_id: item.tenancy_id,
            rent_month: item.rent_month,
            rent_amount: item.rent_amount,
            payment_status: item.payment_status,
            paid_date: item.paid_date,
            remarks: item.remarks,
            created_at: item.created_at,
          },
        }));

        setPendingRents(formattedData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-slate-600 mt-1">Manage properties, tenants, and rent payments</p>
            </div>
            <Link to="/">
              <Button variant="outline">Back to Properties</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-blue-900 mb-4">Management</h2>
          <Link to="/admin/properties">
            <Button className="gap-2">
              <Settings className="w-4 h-4" />
              Manage Properties
            </Button>
          </Link>
        </div>

        {/* Metrics Grid - Clickable */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mb-8">
          {/* Total Properties */}
          <button
            onClick={() => setActiveModal('properties')}
            className="bg-white rounded-lg border border-slate-200 p-4 md:p-6 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
          >
            <p className="text-slate-600 text-xs md:text-sm font-medium">Total Properties</p>
            <p className="text-2xl md:text-4xl font-bold text-slate-900 mt-2">{metrics.totalProperties}</p>
            <p className="text-xs text-slate-500 mt-2">Click to view</p>
          </button>

          {/* Occupied */}
          <button
            onClick={() => setActiveModal('occupied')}
            className="bg-white rounded-lg border border-slate-200 p-4 md:p-6 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
          >
            <p className="text-slate-600 text-xs md:text-sm font-medium">Occupied</p>
            <p className="text-2xl md:text-4xl font-bold text-emerald-600 mt-2">{metrics.occupiedProperties}</p>
            <p className="text-xs text-slate-500 mt-2">Click to view</p>
          </button>

          {/* Vacant */}
          <button
            onClick={() => setActiveModal('vacant')}
            className="bg-white rounded-lg border border-slate-200 p-4 md:p-6 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
          >
            <p className="text-slate-600 text-xs md:text-sm font-medium">Vacant</p>
            <p className="text-2xl md:text-4xl font-bold text-amber-600 mt-2">{metrics.vacantProperties}</p>
            <p className="text-xs text-slate-500 mt-2">Click to view</p>
          </button>

          {/* Total Tenants */}
          <button
            onClick={() => setActiveModal('tenants')}
            className="bg-white rounded-lg border border-slate-200 p-4 md:p-6 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
          >
            <p className="text-slate-600 text-xs md:text-sm font-medium">Total Tenants</p>
            <p className="text-2xl md:text-4xl font-bold text-blue-600 mt-2">{metrics.totalTenants}</p>
            <p className="text-xs text-slate-500 mt-2">Click to view</p>
          </button>

          {/* Pending Rent */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-6">
            <p className="text-slate-600 text-xs md:text-sm font-medium">Pending Rent</p>
            <p className="text-xl md:text-3xl font-bold text-red-600 mt-2">
              ₹{metrics.totalPendingRent.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Pending Rents Table - Responsive */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-8">
          <div className="px-4 md:px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg md:text-xl font-bold text-slate-900">Pending Rent Payments</h2>
          </div>

          {pendingRents.length === 0 ? (
            <div className="p-6 text-center text-slate-600">All rents are paid! ✓</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 md:px-6 py-3 text-left font-semibold text-slate-900">
                      Property
                    </th>
                    <th className="hidden sm:table-cell px-3 md:px-6 py-3 text-left font-semibold text-slate-900">
                      Tenant
                    </th>
                    <th className="hidden md:table-cell px-3 md:px-6 py-3 text-left font-semibold text-slate-900">
                      Month
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left font-semibold text-slate-900">
                      Amount
                    </th>
                    <th className="hidden sm:table-cell px-3 md:px-6 py-3 text-left font-semibold text-slate-900">
                      Status
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left font-semibold text-slate-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pendingRents.map((row) => {
                    const monthDate = new Date(row.payment.rent_month);
                    const monthStr = monthDate.toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <tr key={row.payment.rent_id} className="hover:bg-slate-50">
                        <td className="px-3 md:px-6 py-4 font-medium text-slate-900">
                          <div className="truncate">{row.property.address}</div>
                        </td>
                        <td className="hidden sm:table-cell px-3 md:px-6 py-4 text-slate-600">
                          {row.tenant.name}
                        </td>
                        <td className="hidden md:table-cell px-3 md:px-6 py-4 text-slate-600">
                          {monthStr}
                        </td>
                        <td className="px-3 md:px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                          ₹{row.payment.rent_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="hidden sm:table-cell px-3 md:px-6 py-4">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              row.payment.payment_status === 'partial'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {row.payment.payment_status}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-4">
                          <Link to={`/property/${row.property.property_id}`}>
                            <Button size="sm" variant="outline" className="text-xs md:text-sm">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ended Tenancies Section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ended Tenancies</h2>
          <EndedTenanciesTable />
        </div>
      </div>

      {/* Properties Modal */}
      {activeModal === 'properties' && (
        <Modal onClose={() => setActiveModal(null)} title="All Properties">
          <div className="space-y-2">
            {propertiesData.map(p => (
              <div key={p.property_id} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900 truncate">{p.address}</p>
                  <p className="text-xs text-slate-500">{p.details ? p.details.substring(0, 40) : 'No details'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${p.occupied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {p.occupied ? 'Occupied' : 'Vacant'}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Occupied Properties Modal */}
      {activeModal === 'occupied' && (
        <Modal onClose={() => setActiveModal(null)} title={`Occupied Properties (${metrics.occupiedProperties})`}>
          <div className="space-y-2">
            {propertiesData.filter(p => p.occupied).map(p => (
              <div key={p.property_id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                <p className="font-medium text-slate-900">{p.address}</p>
                <p className="text-xs text-slate-500 mt-1">{p.details || 'No details'}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Vacant Properties Modal */}
      {activeModal === 'vacant' && (
        <Modal onClose={() => setActiveModal(null)} title={`Vacant Properties (${metrics.vacantProperties})`}>
          <div className="space-y-2">
            {propertiesData.filter(p => !p.occupied).map(p => (
              <div key={p.property_id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                <p className="font-medium text-slate-900">{p.address}</p>
                <p className="text-xs text-slate-500 mt-1">{p.details || 'No details'}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Tenants Modal */}
      {activeModal === 'tenants' && (
        <Modal onClose={() => setActiveModal(null)} title={`All Tenants (${metrics.totalTenants})`}>
          <div className="space-y-2">
            {pendingRents.map(row => (
              <div key={row.tenant.tenant_id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                <p className="font-medium text-slate-900">{row.tenant.name}</p>
                <p className="text-xs text-slate-500 mt-1">{row.property.address}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

// Modal Component
function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-lg md:text-xl font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
