import type { RentPayment } from "@/types/index";
import { AlertCircle, MessageCircle } from "lucide-react";

function generateWhatsAppNotifyMessage(
  tenantName: string,
  propertyAddress: string,
  payments: RentPayment[],
): string {
  let message = `Hello ${tenantName},\n\n`;
  message += `This is to notify you regarding your rental property at:\n${propertyAddress}\n\n`;
  message += `📋 PENDING & PARTIAL RENT DETAILS:\n\n`;

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
  message += `Kindly arrange to pay the pending and partial rent at your earliest convenience.\n\n`;
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

export interface PendingRentDetailsProps {
  payments: RentPayment[];
  tenantName?: string;
  tenantPhone?: string;
  propertyAddress?: string;
}

export function PendingRentDetails({
  payments,
  tenantName = "",
  tenantPhone = "",
  propertyAddress = "",
}: PendingRentDetailsProps) {
  const pendingAndPartialPayments = payments.filter(
    (payment) =>
      payment.payment_status === "pending" ||
      payment.payment_status === "partial",
  );

  if (pendingAndPartialPayments.length === 0) {
    return null;
  }

  // Calculate total amount
  const totalAmount = pendingAndPartialPayments.reduce((sum, payment) => {
    if (payment.payment_status === "partial" && payment.remarks) {
      // Extract remaining amount from remarks if it exists
      const match = payment.remarks.match(/Remaining:\s*₹?([\d,]+)/);
      if (match) {
        return sum + parseInt(match[1].replace(/,/g, ""), 10);
      }
    }
    return sum + payment.rent_amount;
  }, 0);

  // Generate WhatsApp message
  const whatsAppMessage =
    tenantName && tenantPhone && propertyAddress
      ? generateWhatsAppNotifyMessage(
          tenantName,
          propertyAddress,
          pendingAndPartialPayments,
        )
      : "";

  const whatsAppLink =
    tenantPhone && whatsAppMessage
      ? generateWhatsAppLink(tenantPhone, whatsAppMessage)
      : "";

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-bold text-slate-900">
            Pending & Partial Rent Details
          </h3>
        </div>
        {whatsAppLink && (
          <a
            href={whatsAppLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors w-full sm:w-auto"
            title="Notify tenant about pending rent"
          >
            <MessageCircle className="w-4 h-4" />
            Notify Tenant
          </a>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Month
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Status
              </th>
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

              if (payment.payment_status === "partial" && payment.remarks) {
                // Extract remaining/outstanding amount from remarks
                const match = payment.remarks.match(/Remaining:\s*₹?([\d,]+)/);
                if (match) {
                  outstandingAmount = parseInt(match[1].replace(/,/g, ""), 10);
                }
              }

              return (
                <tr
                  key={payment.rent_id}
                  className={`border-b border-slate-100 ${
                    index % 2 === 0 ? "bg-slate-50" : "bg-white"
                  }`}
                >
                  <td className="px-6 py-3 text-sm text-slate-900 font-medium whitespace-nowrap">
                    {new Date(payment.rent_month).toLocaleDateString("en-GB", {
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        payment.payment_status === "pending"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {payment.payment_status === "pending"
                        ? "Pending"
                        : "Partial"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-right text-slate-900 font-medium">
                    ₹{payment.rent_amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-semibold">
                    <span className="text-red-600">
                      ₹{outstandingAmount.toLocaleString("en-IN")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 border-t-2 border-slate-200">
            <tr>
              <td
                colSpan={3}
                className="px-6 py-3 text-right text-sm font-bold text-slate-900"
              >
                Total Outstanding:
              </td>
              <td className="px-6 py-3 text-right text-sm font-bold text-red-600">
                ₹{totalAmount.toLocaleString("en-IN")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-4">
        {pendingAndPartialPayments.map((payment) => {
          let outstandingAmount = payment.rent_amount;
          if (payment.payment_status === "partial" && payment.remarks) {
            const match = payment.remarks.match(/Remaining:\s*₹?([\d,]+)/);
            if (match) {
              outstandingAmount = parseInt(match[1].replace(/,/g, ""), 10);
            }
          }

          return (
            <div
              key={payment.rent_id}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-slate-900">
                  {new Date(payment.rent_month).toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    payment.payment_status === "pending"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {payment.payment_status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-slate-500">Rent Amount</p>
                  <p className="font-medium text-slate-900">
                    ₹{payment.rent_amount.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Outstanding</p>
                  <p className="font-bold text-red-600">
                    ₹{outstandingAmount.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div className="p-4 bg-red-50 rounded-lg border border-red-100 mt-2">
          <div className="flex justify-between items-center font-bold text-red-700">
            <span>Total Outstanding</span>
            <span>₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
