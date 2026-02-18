import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Property, Tenancy, Tenant, RentPayment } from "@/types/index";
import { useState, useEffect } from "react";
import { Loader2, MessageCircle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  updateTenant,
  updateTenancy,
  endTenancy,
} from "@/services/supabaseAdmin";

function generateWhatsAppLink(phone: string): string {
  // Format phone number: remove any non-digit characters and add country code if needed
  let formattedPhone = phone.replace(/\D/g, "");
  if (!formattedPhone.startsWith("91") && formattedPhone.length === 10) {
    formattedPhone = "91" + formattedPhone;
  }

  return `https://wa.me/${formattedPhone}`;
}

export interface TenantSummaryProps {
  property: Property;
  tenancy?: (Tenancy & { tenant: Tenant }) | null;
  rentPayments?: RentPayment[];
  onEdit?: () => void;
  onCreateTenancy?: () => void;
  onTenancyEnded?: () => void;
}

export function TenantSummary({
  property,
  tenancy,
  rentPayments = [],
  onEdit,
  onCreateTenancy,
  onTenancyEnded,
}: TenantSummaryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    tenantName: tenancy?.tenant.name || "",
    phone: tenancy?.tenant.phone || "",
    startDate: tenancy?.start_date || "",
    status: tenancy?.status || "active",
    monthlyRent: tenancy?.monthly_rent.toString() || "",
    advanceAmount: tenancy?.advance_amount.toString() || "",
  });

  // Sync editData with tenancy prop changes
  useEffect(() => {
    if (tenancy && !isEditing) {
      setEditData({
        tenantName: tenancy.tenant.name || "",
        phone: tenancy.tenant.phone || "",
        startDate: tenancy.start_date || "",
        status: tenancy.status || "active",
        monthlyRent: tenancy.monthly_rent.toString() || "",
        advanceAmount: tenancy.advance_amount.toString() || "",
      });
    }
  }, [tenancy, isEditing]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Update tenant
      if (
        editData.tenantName !== tenancy?.tenant.name ||
        editData.phone !== tenancy?.tenant.phone
      ) {
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
          status: editData.status as "active" | "completed" | "terminated",
          start_date: editData.startDate,
        });
      }

      toast.success("Tenancy details updated successfully");
      setIsEditing(false);
      await onEdit?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save changes",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      tenantName: tenancy?.tenant.name || "",
      phone: tenancy?.tenant.phone || "",
      startDate: tenancy?.start_date || "",
      status: tenancy?.status || "active",
      monthlyRent: tenancy?.monthly_rent.toString() || "",
      advanceAmount: tenancy?.advance_amount.toString() || "",
    });
    setIsEditing(false);
  };

  const handleEndTenancy = async () => {
    if (
      !confirm(
        "Are you sure you want to end this tenancy? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setIsSaving(true);
      await endTenancy(tenancy!.tenancy_id);
      toast.success("Tenancy ended successfully");
      onTenancyEnded?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to end tenancy");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateReport = () => {
    if (!tenancy) return;

    try {
      // 1. Prepare Tenancy Info Sheet
      const tenancyData = [
        { Field: "Property Address", Value: property.address },
        { Field: "Property Details", Value: property.details },
        { Field: "Tenant Name", Value: tenancy.tenant.name },
        { Field: "Tenant Phone", Value: tenancy.tenant.phone },
        { Field: "Tenant ID Proof", Value: tenancy.tenant.id_proof || "-" },
        { Field: "Tenant Notes", Value: tenancy.tenant.notes || "-" },
        { Field: "Start Date", Value: new Date(tenancy.start_date).toLocaleDateString("en-GB") },
        { Field: "End Date", Value: tenancy.end_date ? new Date(tenancy.end_date).toLocaleDateString("en-GB") : "-" },
        { Field: "Status", Value: tenancy.status },
        { Field: "Monthly Rent", Value: `₹${tenancy.monthly_rent.toLocaleString("en-IN")}` },
        { Field: "Advance Amount", Value: `₹${tenancy.advance_amount.toLocaleString("en-IN")}` },
        { Field: "Tenancy ID", Value: tenancy.tenancy_id },
        { Field: "Property ID", Value: property.property_id },
        { Field: "Tenancy Created", Value: new Date(tenancy.created_at).toLocaleString("en-GB") },
      ];

      // 2. Prepare Detailed Rent History Sheet
      console.log("Generating report with payments:", rentPayments);
      const historyData = (rentPayments || []).map((p) => ({
        "Rent ID": p.rent_id,
        Month: p.rent_month ? new Date(p.rent_month).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "-",
        Amount: p.rent_amount,
        Status: (p.payment_status || "pending").toUpperCase(),
        "Paid Date": p.paid_date ? new Date(p.paid_date).toLocaleDateString("en-GB") : "-",
        Remarks: p.remarks || "-",
        "Created At": p.created_at ? new Date(p.created_at).toLocaleString("en-GB") : "-",
      }));

      // 3. Prepare Pending & Partial Details Sheet
      const pendingAndPartial = (rentPayments || []).filter(p => p.payment_status !== "paid");
      const pendingData = pendingAndPartial.map((p) => {
        let outstandingAmount = p.rent_amount;
        if (p.payment_status === "partial" && p.remarks) {
          const match = p.remarks.match(/Remaining:\s*₹?([\d,]+)/);
          if (match) {
            outstandingAmount = parseInt(match[1].replace(/,/g, ""), 10);
          }
        }

        return {
          Month: p.rent_month ? new Date(p.rent_month).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "-",
          "Total Rent": p.rent_amount,
          "Remaining Balance": outstandingAmount,
          Status: (p.payment_status || "pending").toUpperCase(),
          Remarks: p.remarks || "-",
        };
      });

      // Create workbook and add sheets
      const wb = XLSX.utils.book_new();

      const wsTenancy = XLSX.utils.json_to_sheet(tenancyData);
      XLSX.utils.book_append_sheet(wb, wsTenancy, "Tenancy Profile");

      if (historyData.length > 0) {
        const wsHistory = XLSX.utils.json_to_sheet(historyData);
        XLSX.utils.book_append_sheet(wb, wsHistory, "Rent Payment History");
      }

      if (pendingData.length > 0) {
        const wsPending = XLSX.utils.json_to_sheet(pendingData);
        XLSX.utils.book_append_sheet(wb, wsPending, "Pending & Partial Dues");
      }

      // Generate filename
      const fileName = `${property.address.replace(/[/\\?%*:|"<>]/g, "-")}_Full_Report.xlsx`;

      // Export file
      XLSX.writeFile(wb, fileName);
      toast.success("Comprehensive report generated successfully");
    } catch (err) {
      console.error("Report generation error:", err);
      toast.error("Failed to generate report");
    }
  };

  if (!tenancy) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Property Vacant
          </h3>
          <p className="text-slate-600 mb-4">
            No active tenancy assigned to this property
          </p>
          <Button
            onClick={onCreateTenancy}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create New Tenancy
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
              {property.address}
            </h2>
            <p className="text-slate-600 mt-1 text-sm md:text-base">{property.details}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateReport}
            className="flex items-center gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 h-8 px-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="text-xs font-semibold">Generate Report</span>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2 flex-1 md:flex-none"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 md:flex-none"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
              >
                Edit Details
              </button>
              {tenancy.status === "active" && (
                <button
                  onClick={handleEndTenancy}
                  disabled={isSaving}
                  className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 border border-red-100"
                >
                  End Tenancy
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Tenant Info */}
        <div>
          <label className="text-sm font-medium text-slate-600">
            Tenant Name
          </label>
          {isEditing ? (
            <Input
              type="text"
              value={editData.tenantName}
              onChange={(e) =>
                setEditData({ ...editData, tenantName: e.target.value })
              }
              className="mt-1"
            />
          ) : (
            <p className="text-lg font-semibold text-slate-900 mt-1">
              {tenancy.tenant.name}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600">Phone</label>
          {isEditing ? (
            <Input
              type="tel"
              value={editData.phone}
              onChange={(e) =>
                setEditData({ ...editData, phone: e.target.value })
              }
              className="mt-1"
            />
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
              <p className="text-lg font-semibold text-slate-900">
                {tenancy.tenant.phone}
              </p>
              {tenancy.tenant.phone && (
                <a
                  href={generateWhatsAppLink(tenancy.tenant.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors w-full sm:w-auto"
                  title="Contact tenant on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contact WhatsApp
                </a>
              )}
            </div>
          )}
        </div>

        {/* Tenancy Info */}
        <div>
          <label className="text-sm font-medium text-slate-600">
            Start Date
          </label>
          {isEditing ? (
            <Input
              type="date"
              value={editData.startDate}
              onChange={(e) =>
                setEditData({ ...editData, startDate: e.target.value })
              }
              className="mt-1"
            />
          ) : (
            <p className="text-lg font-semibold text-slate-900 mt-1">
              {new Date(tenancy.start_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
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
                  status: e.target.value as
                    | "active"
                    | "completed"
                    | "terminated",
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
          <label className="text-sm font-medium text-slate-600">
            Monthly Rent
          </label>
          {isEditing ? (
            <Input
              type="number"
              value={editData.monthlyRent}
              onChange={(e) =>
                setEditData({ ...editData, monthlyRent: e.target.value })
              }
              className="mt-1"
            />
          ) : (
            <p className="text-lg font-semibold text-slate-900 mt-1">
              ₹{tenancy.monthly_rent.toLocaleString("en-IN")}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600">
            Advance Amount
          </label>
          {isEditing ? (
            <Input
              type="number"
              value={editData.advanceAmount}
              onChange={(e) =>
                setEditData({ ...editData, advanceAmount: e.target.value })
              }
              className="mt-1"
            />
          ) : (
            <p className="text-lg font-semibold text-slate-900 mt-1">
              ₹{tenancy.advance_amount.toLocaleString("en-IN")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
