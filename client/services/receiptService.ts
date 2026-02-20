import { jsPDF } from "jspdf";
import { uploadTenancyDocument } from "./supabaseAdmin";
import type { Property, Tenant, Tenancy, RentPayment } from "@/types/index";

export async function generateAndSendReceipt(
  property: Property,
  tenant: Tenant,
  tenancy: Tenancy,
  payment: RentPayment
) {
  const doc = new jsPDF();

  // Add Receipt content
  const margin = 20;
  let y = margin;

  doc.setFontSize(22);
  doc.text("RENT RECEIPT", 105, y, { align: "center" });
  y += 20;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Receipt Details:", margin, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.text(`Receipt No: REC-${payment.rent_id}`, margin, y);
  doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, 150, y);
  y += 10;

  doc.line(margin, y, 190, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Property Details:", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(property.address, margin, y);
  y += 15;

  doc.setFont("helvetica", "bold");
  doc.text("Tenant Details:", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(tenant.name, margin, y);
  doc.text(tenant.phone, margin, y + 6);
  y += 20;

  doc.line(margin, y, 190, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Payment Summary:", margin, y);
  y += 10;

  const monthStr = new Date(payment.rent_month).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const tableData = [
    ["Description", "Details"],
    ["Rent Month", monthStr],
    ["Rent Amount", `INR ${payment.rent_amount.toLocaleString("en-IN")}`],
    ["Payment Status", payment.payment_status.toUpperCase()],
    ["Paid Date", payment.paid_date ? new Date(payment.paid_date).toLocaleDateString("en-GB") : "-"],
    ["Remarks", payment.remarks || "-"],
  ];

  tableData.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 80, y);
    y += 8;
  });

  y += 10;
  doc.line(margin, y, 190, y);
  y += 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("This is a computer generated receipt and does not require a signature.", 105, y, { align: "center" });

  // Generate PDF as Blob
  const pdfBlob = doc.output("blob");
  const fileName = `Receipt_${property.address.replace(/\s+/g, "_")}_${monthStr.replace(/\s+/g, "_")}.pdf`;
  const file = new File([pdfBlob], fileName, { type: "application/pdf" });

  // Upload to Supabase
  const result = await uploadTenancyDocument(tenancy.tenancy_id, file, "Rent Receipt");

  if (!result || !result.signed_url) {
    throw new Error("Failed to get download link for the receipt");
  }

  // Generate WhatsApp Message
  const message = `Hello ${tenant.name},\n\nYour rent for ${monthStr} for the property at ${property.address} has been received and marked as PAID.\n\nYou can download your payment receipt here:\n${result.signed_url}\n\nThank you!`;
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${tenant.phone.replace(/\D/g, "")}?text=${encodedMessage}`;

  return whatsappUrl;
}
