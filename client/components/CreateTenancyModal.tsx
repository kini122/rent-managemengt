import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createTenant, createTenancy } from "@/services/supabaseAdmin";
import { supabase } from "@/lib/supabaseClient";
import type { Tenant } from "@/types/index";

interface CreateTenancyModalProps {
  propertyId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTenancyModal({
  propertyId,
  isOpen,
  onClose,
  onSuccess,
}: CreateTenancyModalProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTenants, setFetchingTenants] = useState(false);
  const [mode, setMode] = useState<"select" | "create">("select");
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

  // New tenant form
  const [newTenant, setNewTenant] = useState({
    name: "",
    phone: "",
    id_proof: "",
    notes: "",
  });

  // Tenancy form
  const [tenancyData, setTenancyData] = useState({
    start_date: new Date().toISOString().split("T")[0],
    monthly_rent: "",
    advance_amount: "",
    status: "active" as const,
  });

  // Fetch existing tenants
  useEffect(() => {
    if (isOpen) {
      fetchTenants();
    }
  }, [isOpen]);

  const fetchTenants = async () => {
    try {
      setFetchingTenants(true);
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("name");

      if (error) throw error;
      setTenants(data || []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to fetch tenants",
      );
    } finally {
      setFetchingTenants(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenant.name.trim()) {
      toast.error("Tenant name is required");
      return;
    }

    try {
      setLoading(true);
      const tenant = await createTenant({
        name: newTenant.name,
        phone: newTenant.phone,
        id_proof: newTenant.id_proof,
        notes: newTenant.notes,
      });

      setSelectedTenantId(tenant.tenant_id);
      setNewTenant({ name: "", phone: "", id_proof: "", notes: "" });
      setMode("select");
      await fetchTenants();
      toast.success("Tenant created successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create tenant",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenancy = async () => {
    const tenantId = mode === "create" ? selectedTenantId : selectedTenantId;

    if (!tenantId) {
      toast.error("Please select or create a tenant");
      return;
    }

    if (!tenancyData.monthly_rent) {
      toast.error("Monthly rent is required");
      return;
    }

    try {
      setLoading(true);
      await createTenancy({
        property_id: propertyId,
        tenant_id: tenantId,
        start_date: tenancyData.start_date,
        end_date: null,
        monthly_rent: parseFloat(tenancyData.monthly_rent),
        advance_amount: parseFloat(tenancyData.advance_amount || "0"),
        status: tenancyData.status,
      });

      toast.success("Tenancy created successfully");
      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create tenancy",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMode("select");
    setSelectedTenantId(null);
    setNewTenant({ name: "", phone: "", id_proof: "", notes: "" });
    setTenancyData({
      start_date: new Date().toISOString().split("T")[0],
      monthly_rent: "",
      advance_amount: "",
      status: "active",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Tenancy</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tenant Selection/Creation */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Tenant
            </label>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode("select")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  mode === "select"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Select Existing
              </button>
              <button
                onClick={() => setMode("create")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  mode === "create"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Create New
              </button>
            </div>

            {mode === "select" ? (
              // Select existing tenant
              <div>
                {fetchingTenants ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  </div>
                ) : tenants.length === 0 ? (
                  <p className="text-slate-600 text-sm">
                    No tenants found. Create a new one.
                  </p>
                ) : (
                  <select
                    value={selectedTenantId || ""}
                    onChange={(e) =>
                      setSelectedTenantId(parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select a tenant --</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.tenant_id} value={tenant.tenant_id}>
                        {tenant.name} {tenant.phone ? `(${tenant.phone})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              // Create new tenant
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Tenant Name *"
                  value={newTenant.name}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, name: e.target.value })
                  }
                  className="w-full"
                />
                <Input
                  type="tel"
                  placeholder="Phone"
                  value={newTenant.phone}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, phone: e.target.value })
                  }
                  className="w-full"
                />
                <Input
                  type="text"
                  placeholder="ID Proof"
                  value={newTenant.id_proof}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, id_proof: e.target.value })
                  }
                  className="w-full"
                />
                <textarea
                  placeholder="Notes"
                  value={newTenant.notes}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Tenancy Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date *
              </label>
              <Input
                type="date"
                value={tenancyData.start_date}
                onChange={(e) =>
                  setTenancyData({ ...tenancyData, start_date: e.target.value })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Monthly Rent (₹) *
              </label>
              <Input
                type="number"
                placeholder="0"
                value={tenancyData.monthly_rent}
                onChange={(e) =>
                  setTenancyData({
                    ...tenancyData,
                    monthly_rent: e.target.value,
                  })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Advance Amount (₹)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={tenancyData.advance_amount}
                onChange={(e) =>
                  setTenancyData({
                    ...tenancyData,
                    advance_amount: e.target.value,
                  })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                value={tenancyData.status}
                onChange={(e) =>
                  setTenancyData({
                    ...tenancyData,
                    status: e.target.value as
                      | "active"
                      | "completed"
                      | "terminated",
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (mode === "create") {
                handleCreateTenant();
              } else {
                handleCreateTenancy();
              }
            }}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "create" ? "Create Tenant & Continue" : "Create Tenancy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
