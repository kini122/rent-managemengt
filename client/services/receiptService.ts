import { jsPDF } from "jspdf";
import { uploadTenancyDocument, getLandlordProfile, getReceiptForPayment, saveReceipt } from "./supabaseAdmin";
import type { Property, Tenant, Tenancy, RentPayment, LandlordProfile } from "@/types/index";

export async function generateAndSendReceipt(
  property: Property,
  tenant: Tenant,
  tenancy: Tenancy,
  payment: RentPayment
) {
  // Check if receipt already exists for this payment (idempotency)
  const existingReceipt = await getReceiptForPayment(payment.rent_id);
  if (existingReceipt) {
    // Return WhatsApp URL with existing receipt
    const message = generateWhatsAppMessage(
      tenant.name,
      new Date(payment.rent_month).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      }),
      property.address,
      existingReceipt.download_url
    );

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${tenant.phone.replace(/\D/g, "")}?text=${encodedMessage}`;
    return whatsappUrl;
  }

  // Get landlord profile
  const landlordProfile = await getLandlordProfile();

  const doc = new jsPDF();

  // Add Receipt content
  const margin = 20;
  let y = margin;

  // Header with landlord info
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(landlordProfile?.landlord_name || "Rent Receipt", 105, y, { align: "center" });
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (landlordProfile?.building_name) {
    doc.text(landlordProfile.building_name, 105, y, { align: "center" });
    y += 5;
  }

  if (landlordProfile?.address) {
    const addressLines = doc.splitTextToSize(landlordProfile.address, 160);
    doc.text(addressLines, 105, y, { align: "center" });
    y += addressLines.length * 4 + 2;
  }

  if (landlordProfile?.phone) {
    doc.text(`Phone: ${landlordProfile.phone}`, 105, y, { align: "center" });
    y += 5;
  }

  y += 5;
  doc.line(margin, y, 190, y);
  y += 8;

  // Receipt Title and Details
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RENT RECEIPT", 105, y, { align: "center" });
  y += 12;

  // Receipt number and date
  const receiptNumber = `REC-${payment.rent_id}-${Date.now().toString().slice(-4)}`;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Receipt No:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(receiptNumber, 60, y);
  doc.setFont("helvetica", "bold");
  doc.text("Date:", 150, y);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("en-GB"), 170, y);
  y += 8;

  doc.line(margin, y, 190, y);
  y += 8;

  // Property Details
  doc.setFont("helvetica", "bold");
  doc.text("PROPERTY DETAILS", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(`Address: ${property.address}`, margin + 2, y);
  y += 6;
  if (landlordProfile?.building_name) {
    doc.text(`Building: ${landlordProfile.building_name}`, margin + 2, y);
    y += 6;
  }

  y += 4;

  // Tenant Details
  doc.setFont("helvetica", "bold");
  doc.text("TENANT DETAILS", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${tenant.name}`, margin + 2, y);
  y += 6;
  doc.text(`Phone: ${tenant.phone}`, margin + 2, y);
  y += 8;

  doc.line(margin, y, 190, y);
  y += 8;

  // Payment Details Table
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT DETAILS", margin, y);
  y += 8;

  const monthStr = new Date(payment.rent_month).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const paymentDetails = [
    { label: "Rent Month", value: monthStr },
    { label: "Amount", value: `₹${payment.rent_amount.toLocaleString("en-IN")}` },
    { label: "Payment Status", value: payment.payment_status.toUpperCase() },
    { label: "Paid Date", value: payment.paid_date ? new Date(payment.paid_date).toLocaleDateString("en-GB") : "-" },
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  paymentDetails.forEach(({ label, value }) => {
    doc.setFont("helvetica", "bold");
    doc.text(label + ":", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 80, y);
    y += 7;
  });

  if (payment.remarks && payment.remarks !== "-") {
    const cleanRemarks = payment.remarks.replace(/₹/g, "₹ ");
    const remarkLines = doc.splitTextToSize(cleanRemarks, 110);
    doc.setFont("helvetica", "bold");
    doc.text("Remarks:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(remarkLines, 80, y);
    y += remarkLines.length * 5 + 2;
  }

  y += 8;
  doc.line(margin, y, 190, y);
  y += 10;

  // Footer
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("This is a computer-generated receipt. No signature required.", 105, y, { align: "center" });

  // Generate PDF as Blob
  const pdfBlob = doc.output("blob");
  const fileName = `Receipt_${property.address.replace(/\s+/g, "_")}_${monthStr.replace(/\s+/g, "_")}.pdf`;
  const file = new File([pdfBlob], fileName, { type: "application/pdf" });

  // Upload to Supabase
  const result = await uploadTenancyDocument(tenancy.tenancy_id, file, "Rent Receipt");

  if (!result || !result.signed_url) {
    throw new Error("Failed to get download link for the receipt");
  }

  // Save receipt record for idempotency
  await saveReceipt({
    rent_id: payment.rent_id,
    file_path: result.file_path,
    download_url: result.signed_url,
    receipt_number: receiptNumber,
  });

  // Generate WhatsApp Message
  const message = generateWhatsAppMessage(
    tenant.name,
    monthStr,
    property.address,
    result.signed_url
  );

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${tenant.phone.replace(/\D/g, "")}?text=${encodedMessage}`;

  return whatsappUrl;
}

function generateWhatsAppMessage(
  tenantName: string,
  monthStr: string,
  propertyAddress: string,
  receiptUrl: string
): string {
  return `Hello ${tenantName},\n\nYour rent for ${monthStr} for the property at ${propertyAddress} has been received and marked as PAID.\n\nReceipt: ${receiptUrl}\n\nThank you!`;
}
