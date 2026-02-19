import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronDown, ChevronUp, Edit2, Check, X, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { updateRentPayment } from "@/services/supabaseAdmin";
import type { Tenancy, Tenant, Property, RentPayment } from "@/types/index";

function generateWhatsAppNotifyMessage(
  tenantName: string,
  propertyAddress: string,
  payments: RentPayment[],
): string {
  let message = `Hello ${tenantName},\n\n`;
  message += `This is to notify you regarding your previous rental property at:\n${propertyAddress}\n\n`;
  message += `PENDING & PARTIAL RENT DETAILS (ENDED TENANCY):\n\n`;

  // Create table structure with aligned columns
  message += `Month          | Status   | Amount\n`;
  message += `────────────────────────────────────\n`;

  let totalOutstanding = 0;

  for (const payment of payments) {
    const monthName = new Date(payment.rent_month).toLocaleDateString("en-GB", {
      month: "short",
      year: "2-digit",
    });

    let outstandingAmount = payment.rent_amount;
    if (payment.payment_status === "partial" && payment.remarks) {
      const match = payment.remarks.match(/Remaining:\s*₹?([\d,]+)/);
      if (match) {
        outstandingAmount = parseInt(match[1].replace(/,/g, ""), 10);
      }
    }

    totalOutstanding += outstandingAmount;

    const status = payment.payment_status === "pending" ? "Pending" : "Partial";
    const amount = `₹${outstandingAmount.toLocaleString("en-IN")}`;

    // Format with proper spacing
    const paddedMonth = monthName.padEnd(15);
    const paddedStatus = status.padEnd(9);
    message += `${paddedMonth}| ${paddedStatus}| ${amount}\n`;
  }

  message += `────────────────────────────────────\n`;
  message += `TOTAL OUTSTANDING: ₹${totalOutstanding.toLocaleString("en-IN")}\n\n`;
  message += `Kindly arrange to settle these dues at your earliest convenience.\n\n`;
  message += `For any queries, please feel free to reach out.\n`;
  message += `Thank you.`;

  return message;
}

function generateWhatsAppLink(phone: string, message: string): string {
  let formattedPhone = phone.replace(/\D/g, "");
  if (!formattedPhone.startsWith("91") && formattedPhone.length === 10) {
    formattedPhone = "91" + formattedPhone;
  }

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

interface EndedTenancyRecord extends Tenancy {
  property: Property;
  tenant: Tenant;
  hasPending?: boolean;
}

export function EndedTenanciesTable() {
  const [tenancies, setTenancies] = useState<EndedTenancyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [notifyingId, setNotifyingId] = useState<number | null>(null);

  useEffect(() => {
    fetchEndedTenancies();
  }, []);

  const fetchEndedTenancies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tenancies")
        .select("*, property:properties(*), tenant:tenants(*), rent_payments(payment_status)")
        .not("end_date", "is", null)
        .order("end_date", { ascending: false });

      if (error) throw error;

      const enrichedData = (data || []).map(t => ({
        ...t,
        hasPending: t.rent_payments?.some((p: any) => p.payment_status === "pending" || p.payment_status === "partial")
      }));

      setTenancies(enrichedData);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to fetch ended tenancies",
      );
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

  const handleNotifyTenant = async (tenancy: EndedTenancyRecord) => {
    if (!tenancy.tenant?.phone) {
      toast.error("Tenant phone number not found");
      return;
    }

    try {
      setNotifyingId(tenancy.tenancy_id);

      // Fetch pending/partial payments for this tenancy
      const { data: payments, error } = await supabase
        .from("rent_payments")
        .select("*")
        .eq("tenancy_id", tenancy.tenancy_id)
        .in("payment_status", ["pending", "partial"])
        .order("rent_month", { ascending: false });

      if (error) throw error;

      if (!payments || payments.length === 0) {
        toast.info("No pending or partial rent found for this tenancy");
        return;
      }

      const message = generateWhatsAppNotifyMessage(
        tenancy.tenant.name,
        tenancy.property?.address || "Unknown Property",
        payments
      );

      const link = generateWhatsAppLink(tenancy.tenant.phone, message);
      window.open(link, "_blank");
      toast.success("WhatsApp notification opened");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate notification");
    } finally {
      setNotifyingId(null);
    }
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
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-12 px-4 py-3 text-center"></th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">
                Property
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">
                Tenant
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">
                Start Date
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">
                End Date
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-900">
                Monthly Rent
              </th>
              <th className="px-4 py-3 text-center font-semibold text-slate-900">
                Status
              </th>
              <th className="px-4 py-3 text-center font-semibold text-slate-900">
                Action
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
                onNotify={() => handleNotifyTenant(tenancy)}
                isNotifying={notifyingId === tenancy.tenancy_id}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-slate-200">
        {tenancies.map((tenancy) => (
          <div key={tenancy.tenancy_id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate">{tenancy.property?.address}</p>
                <p className="text-sm text-slate-600 mt-1">{tenancy.tenant?.name}</p>
              </div>
              <button
                onClick={() => toggleRowExpand(tenancy.tenancy_id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600"
              >
                {expandedRows.has(tenancy.tenancy_id) ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-slate-500 font-medium">Start</p>
                <p className="text-slate-900 font-medium">
                  {new Date(tenancy.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">End</p>
                <p className="text-slate-900 font-medium">
                  {tenancy.end_date ? new Date(tenancy.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Rent</p>
                <p className="text-slate-900 font-medium">₹{(tenancy.monthly_rent / 1000).toFixed(0)}K</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                {tenancy.status}
              </span>
              {expandedRows.has(tenancy.tenancy_id) ? (
                tenancy.hasPending && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotifyTenant(tenancy);
                    }}
                    disabled={notifyingId === tenancy.tenancy_id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {notifyingId === tenancy.tenancy_id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <MessageCircle className="w-3 h-3" />
                    )}
                    Notify
                  </button>
                )
              ) : (
                tenancy.hasPending && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase tracking-wider">
                    Pending
                  </span>
                )
              )}
            </div>

            {expandedRows.has(tenancy.tenancy_id) && (
              <div className="pt-3 border-t border-slate-200">
                <ExpandedTenancyDetails tenancyId={tenancy.tenancy_id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EndedTenancyRow({
  tenancy,
  isExpanded,
  onToggleExpand,
  onNotify,
  isNotifying,
}: {
  tenancy: EndedTenancyRecord;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onNotify: () => void;
  isNotifying: boolean;
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
          {tenancy.property?.address || "-"}
        </td>
        <td className="px-4 py-4 text-sm text-slate-600">
          <div className="font-medium text-slate-900">
            {tenancy.tenant?.name || "-"}
          </div>
          <div className="text-xs text-slate-500">
            {tenancy.tenant?.phone || "-"}
          </div>
        </td>
        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
          {new Date(tenancy.start_date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </td>
        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
          {tenancy.end_date
            ? new Date(tenancy.end_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "-"}
        </td>
        <td className="px-4 py-4 text-sm font-medium text-slate-900 text-right whitespace-nowrap">
          ₹{tenancy.monthly_rent.toLocaleString("en-IN")}
        </td>
        <td className="px-4 py-4 text-center">
          <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium whitespace-nowrap">
            {tenancy.status}
          </span>
        </td>
        <td className="px-4 py-4 text-center">
          {isExpanded ? (
            tenancy.hasPending && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNotify();
                }}
                disabled={isNotifying}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                title="Notify tenant about pending rent"
              >
                {isNotifying ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <MessageCircle className="w-3 h-3" />
                )}
                Notify
              </button>
            )
          ) : (
            tenancy.hasPending && (
              <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase tracking-wider">
                Pending
              </span>
            )
          )}
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
    [key: number]: {
      paid_date: string;
      remarks: string;
      status?: "paid" | "pending" | "partial";
      paidAmount?: number;
    };
  }>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    fetchRentPayments();
  }, [tenancyId]);

  const fetchRentPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("rent_payments")
        .select("*")
        .eq("tenancy_id", tenancyId)
        .order("rent_month", { ascending: false });

      if (error) throw error;
      setRentPayments(data || []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to fetch rent payments",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (payment: RentPayment) => {
    setEditingId(payment.rent_id);
    // Parse paid amount from remarks if it exists (format: "Paid: ₹X")
    let paidAmount = 0;
    if (payment.payment_status === "partial" && payment.remarks) {
      const match = payment.remarks.match(/Paid:\s*₹?([\d,]+)/);
      if (match) {
        paidAmount = parseInt(match[1].replace(/,/g, ""), 10);
      }
    }
    setEditData({
      [payment.rent_id]: {
        paid_date: payment.paid_date || "",
        remarks: payment.remarks || "",
        status: payment.payment_status,
        paidAmount: paidAmount || undefined,
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

      // If marking as partial, require paid amount
      if (data.status === "partial" && !data.paidAmount) {
        toast.error("Please enter the paid amount for partial payment");
        setSavingId(null);
        return;
      }

      // Format remarks to include paid amount for partial payments
      let finalRemarks = data.remarks;
      if (data.status === "partial" && data.paidAmount) {
        const remaining = payment.rent_amount - data.paidAmount;
        finalRemarks = `Paid: ₹${data.paidAmount.toLocaleString("en-IN")} | Remaining: ₹${remaining.toLocaleString("en-IN")}`;
        if (data.remarks && data.remarks.trim()) {
          finalRemarks += ` | ${data.remarks}`;
        }
      }

      await updateRentPayment(payment.rent_id, {
        payment_status: data.status || payment.payment_status,
        paid_date: data.paid_date || null,
        remarks: finalRemarks,
      });

      toast.success("Payment details updated");
      setEditingId(null);
      setEditData({});
      await fetchRentPayments();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update payment",
      );
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
      <h4 className="font-semibold text-slate-900 text-sm">
        Rent Payment History
      </h4>
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
                ? new Date(payment.paid_date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "-";

              return (
                <tr key={payment.rent_id} className="hover:bg-white">
                  <td className="px-4 py-2 text-slate-900 font-medium">
                    {new Date(payment.rent_month).toLocaleDateString("en-GB", {
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-900 text-right">
                    ₹{payment.rent_amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {isEditing ? (
                      <select
                        value={
                          editData[payment.rent_id]?.status ||
                          payment.payment_status
                        }
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            [payment.rent_id]: {
                              ...editData[payment.rent_id],
                              status: e.target.value as
                                | "paid"
                                | "pending"
                                | "partial",
                            },
                          })
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                          payment.payment_status === "paid"
                            ? "bg-green-100 text-green-700"
                            : payment.payment_status === "partial"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {payment.payment_status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editData[payment.rent_id]?.paid_date || ""}
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
                        value={editData[payment.rent_id]?.remarks || ""}
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
                        {payment.remarks || "-"}
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
