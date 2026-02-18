import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { createProperty, updateProperty, deleteProperty } from '@/services/supabaseAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Property } from '@/types/index';

export default function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ address: '', details: '' });

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('property_id', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.address.trim()) {
      toast.error('Property address is required');
      return;
    }

    try {
      if (editingId) {
        await updateProperty(editingId, formData);
        toast.success('Property updated successfully');
      } else {
        await createProperty({ ...formData, is_active: true });
        toast.success('Property created successfully');
      }

      setFormData({ address: '', details: '' });
      setEditingId(null);
      setShowForm(false);
      await fetchProperties();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save property');
    }
  };

  const handleEdit = (property: Property) => {
    setFormData({ address: property.address, details: property.details || '' });
    setEditingId(property.property_id);
    setShowForm(true);
  };

  const handleDelete = async (id: number, address: string) => {
    if (!confirm(`Are you sure you want to delete "${address}"? This action cannot be undone.`)) return;

    try {
      setDeleting(id);
      await deleteProperty(id);
      toast.success('Property deleted successfully');
      await fetchProperties();
    } catch (err) {
      console.error('Delete error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete property';

      if (errorMsg.includes('violates foreign key') || errorMsg.includes('constraint')) {
        toast.error('Cannot delete property due to database constraints. The system tried to clean up dependencies but failed. Please check your database setup.');
      } else if (errorMsg.toLowerCase().includes('row level security') || errorMsg.toLowerCase().includes('policy')) {
        toast.error('Permission denied. Your database security (RLS) is preventing this deletion. Please ensure RLS is disabled or you have proper delete policies.');
      } else {
        toast.error(`Delete failed: ${errorMsg}`);
      }
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-lg md:text-3xl font-bold text-slate-900 truncate">Properties</h1>
            </div>
            <div className="flex gap-1 md:gap-2">
              <Link to="/admin">
                <Button variant="outline" size="sm" className="whitespace-nowrap px-2 md:px-4">
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
              <Button onClick={() => setShowForm(true)} size="sm" className="gap-1.5 whitespace-nowrap px-2 md:px-4">
                <Plus className="w-4 h-4" />
                <span>Add Property</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Property' : 'Add New Property'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ address: '', details: '' });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Property Address *
                </label>
                <Input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Details
                </label>
                <textarea
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Property description, amenities, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="gap-2">
                  {editingId ? 'Update Property' : 'Create Property'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ address: '', details: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Properties Table - Responsive */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
            <p className="text-slate-600 mb-4">No properties yet</p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create First Property
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {properties.map((property) => (
                    <tr key={property.property_id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {property.address}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm max-w-xs truncate">
                        {property.details ? property.details.substring(0, 50) + (property.details.length > 50 ? '...' : '') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={async () => {
                            try {
                              await updateProperty(property.property_id, {
                                is_active: !property.is_active,
                              });
                              toast.success(
                                `Property marked as ${!property.is_active ? 'Active' : 'Inactive'}`
                              );
                              await fetchProperties();
                            } catch (err) {
                              toast.error('Failed to update property status');
                            }
                          }}
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                            property.is_active
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {property.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link to={`/property/${property.property_id}`}>
                            <button className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium">
                              Manage
                            </button>
                          </Link>
                          <button
                            onClick={() => handleEdit(property)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(property.property_id, property.address)}
                            disabled={deleting === property.property_id}
                            className="inline-flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deleting === property.property_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-200">
              {properties.map((property) => (
                <div key={property.property_id} className="p-4 space-y-3">
                  <div>
                    <p className="font-bold text-slate-900">{property.address}</p>
                    {property.details && (
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{property.details}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={async () => {
                        try {
                          await updateProperty(property.property_id, {
                            is_active: !property.is_active,
                          });
                          toast.success(
                            `Property marked as ${!property.is_active ? 'Active' : 'Inactive'}`
                          );
                          await fetchProperties();
                        } catch (err) {
                          toast.error('Failed to update property status');
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        property.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {property.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <Link to={`/property/${property.property_id}`} className="flex-1">
                      <button className="w-full px-3 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium transition-colors">
                        Manage
                      </button>
                    </Link>
                    <button
                      onClick={() => handleEdit(property)}
                      className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(property.property_id, property.address)}
                      disabled={deleting === property.property_id}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    >
                      {deleting === property.property_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
