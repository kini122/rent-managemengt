import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RentPayment } from "@/types/index";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Loader2, Edit2, Check, X } from "lucide-react";
import { updateRentPayment } from "@/services/supabaseAdmin";
import { toast } from "sonner";

export interface RentTableProps {
  payments: RentPayment[];
  onUpdateStatus?: (
    rentId: number,
    status: "paid" | "pending" | "partial",
  ) => Promise<void>;
  onMarkPaid?: (rentId: number) => Promise<void>;
  onRefresh?: () => Promise<void>;
  isEditable?: boolean;
}

function getStatusColor(status: string) {
  switch (status) {
    case "paid":
      return {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        badge: "emerald",
      };
    case "partial":
      return { bg: "bg-amber-100", text: "text-amber-700", badge: "amber" };
    default:
      return { bg: "bg-red-100", text: "text-red-700", badge: "red" };
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
    [key: number]: {
      paid_date: string;
      remarks: string;
      status?: "paid" | "pending" | "partial";
      paidAmount?: number;
    };
  }>({});
  const [savingId, setSavingId] = useState<number | null>(null);

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
      await onRefresh?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update payment",
      );
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
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 md:px-6 py-3 text-left font-semibold text-slate-900">
                Month
              </th>
              <th className="px-4 md:px-6 py-3 text-left font-semibold text-slate-900">
                Rent Amount
              </th>
              <th className="px-4 md:px-6 py-3 text-left font-semibold text-slate-900">
                Status
              </th>
              <th className="hidden lg:table-cell px-4 md:px-6 py-3 text-left font-semibold text-slate-900">
                Paid Date
              </th>
              <th className="hidden lg:table-cell px-4 md:px-6 py-3 text-left font-semibold text-slate-900">
                Remarks
              </th>
              <th className="px-4 md:px-6 py-3 text-left font-semibold text-slate-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {payments.map((payment) => {
              const statusColor = getStatusColor(payment.payment_status);
              const monthDate = new Date(payment.rent_month);
              const monthStr = monthDate.toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              });
              const paidDateStr = payment.paid_date
                ? new Date(payment.paid_date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "-";

              const isEditing = editingId === payment.rent_id;

              return (
                <tr
                  key={payment.rent_id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 md:px-6 py-4 font-medium text-slate-900 text-sm">
                    {monthStr}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-slate-900 font-medium whitespace-nowrap">
                    ₹{payment.rent_amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 md:px-6 py-4 space-y-2">
                    {isEditing ? (
                      <>
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
                          className="w-full px-3 py-1 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="partial">Partial</option>
                        </select>
                        {editData[payment.rent_id]?.status === "partial" && (
                          <div className="text-xs space-y-1">
                            <label className="block font-medium text-slate-700">
                              Paid Amount (₹)
                            </label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={
                                editData[payment.rent_id]?.paidAmount || ""
                              }
                              onChange={(e) => {
                                const amount = e.target.value
                                  ? parseInt(e.target.value)
                                  : 0;
                                setEditData({
                                  ...editData,
                                  [payment.rent_id]: {
                                    ...editData[payment.rent_id],
                                    paidAmount: amount,
                                  },
                                });
                              }}
                              className="w-full text-sm"
                              max={payment.rent_amount}
                            />
                            {editData[payment.rent_id]?.paidAmount ? (
                              <div className="text-slate-600 bg-slate-50 p-2 rounded">
                                <div>
                                  Paid: ₹
                                  {editData[
                                    payment.rent_id
                                  ].paidAmount?.toLocaleString("en-IN")}
                                </div>
                                <div>
                                  Remaining: ₹
                                  {(
                                    payment.rent_amount -
                                    (editData[payment.rent_id].paidAmount || 0)
                                  ).toLocaleString("en-IN")}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </>
                    ) : (
                      <span
                        className={cn(
                          "inline-block px-3 py-1 rounded-full text-xs font-medium capitalize",
                          statusColor.bg,
                          statusColor.text,
                        )}
                      >
                        {payment.payment_status}
                      </span>
                    )}
                  </td>
                  <td className="hidden lg:table-cell px-4 md:px-6 py-4 text-sm">
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
                        className="w-full text-sm"
                      />
                    ) : (
                      <span className="text-slate-600">{paidDateStr}</span>
                    )}
                  </td>
                  <td className="hidden lg:table-cell px-4 md:px-6 py-4 text-sm">
                    {isEditing ? (
                      <Input
                        type="text"
                        placeholder="Add remarks..."
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
                        className="w-full text-sm"
                      />
                    ) : (
                      <span className="text-slate-600 max-w-xs truncate block">
                        {payment.remarks || "-"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-sm space-x-1">
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
                        {isEditable && payment.payment_status !== "paid" && (
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
                              "Mark Paid"
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

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-200">
        {payments.map((payment) => {
          const statusColor = getStatusColor(payment.payment_status);
          const monthDate = new Date(payment.rent_month);
          const monthStr = monthDate.toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
          });
          const paidDateStr = payment.paid_date
            ? new Date(payment.paid_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "-";

          const isEditing = editingId === payment.rent_id;

          return (
            <div key={payment.rent_id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-slate-900">{monthStr}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    ₹{payment.rent_amount.toLocaleString("en-IN")}
                  </p>
                </div>
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                    statusColor.bg,
                    statusColor.text,
                  )}
                >
                  {payment.payment_status}
                </span>
              </div>

              {isEditing && editData[payment.rent_id]?.status === "partial" && (
                <div className="text-xs space-y-2">
                  <label className="block font-medium text-slate-700">
                    Paid Amount (₹)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={editData[payment.rent_id]?.paidAmount || ""}
                    onChange={(e) => {
                      const amount = e.target.value ? parseInt(e.target.value) : 0;
                      setEditData({
                        ...editData,
                        [payment.rent_id]: {
                          ...editData[payment.rent_id],
                          paidAmount: amount,
                        },
                      });
                    }}
                    className="w-full text-sm"
                    max={payment.rent_amount}
                  />
                </div>
              )}

              <div className="text-xs space-y-2 border-t border-slate-200 pt-3">
                <div>
                  <p className="text-slate-500 font-medium">Paid Date</p>
                  <p className="text-slate-900">{paidDateStr}</p>
                </div>
                {payment.remarks && (
                  <div>
                    <p className="text-slate-500 font-medium">Notes</p>
                    <p className="text-slate-900 line-clamp-2">{payment.remarks}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-200">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => handleSaveEdit(payment)}
                      disabled={savingId === payment.rent_id}
                      className="flex-1 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50 font-medium text-sm"
                    >
                      {savingId === payment.rent_id ? (
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      ) : (
                        <Check className="w-4 h-4 inline mr-2" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={savingId === payment.rent_id}
                      className="flex-1 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded transition-colors disabled:opacity-50 font-medium text-sm"
                    >
                      <X className="w-4 h-4 inline mr-2" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {isEditable && (
                      <button
                        onClick={() => handleEditClick(payment)}
                        className="flex-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded transition-colors font-medium text-sm"
                      >
                        <Edit2 className="w-4 h-4 inline mr-2" />
                        Edit
                      </button>
                    )}
                    {isEditable && payment.payment_status !== "paid" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkPaid(payment.rent_id)}
                        disabled={loading === payment.rent_id}
                        className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      >
                        {loading === payment.rent_id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span className="text-xs">Marking...</span>
                          </>
                        ) : (
                          <span className="text-xs">Mark Paid</span>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
