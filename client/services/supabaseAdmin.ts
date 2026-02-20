import { supabase } from "@/lib/supabaseClient";
import type {
  Property,
  Tenant,
  Tenancy,
  RentPayment,
  TenancyDocument,
} from "@/types/index";

// Properties
export async function createProperty(
  data: Omit<Property, "property_id" | "created_at">,
) {
  const { data: result, error } = await supabase
    .from("properties")
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateProperty(id: number, data: Partial<Property>) {
  const { data: result, error } = await supabase
    .from("properties")
    .update(data)
    .eq("property_id", id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deleteProperty(id: number) {
  // 1. Get all tenancies for this property
  const { data: tenancies } = await supabase
    .from("tenancies")
    .select("*")
    .eq("property_id", id);

  const hasTenancies = tenancies && tenancies.length > 0;

  if (hasTenancies) {
    // Check if it's "not vacant" (has an active tenancy)
    const activeTenancy = tenancies.find(t => !t.end_date && t.status === "active");

    if (activeTenancy) {
      // "Add the tenancy to the ended tenancies"
      // This means marking it as ended so it shows up in history
      await endTenancy(activeTenancy.tenancy_id);
    }

    // Since we want to keep history in "Ended Tenancies", we CANNOT hard-delete
    // the property record if it has any tenancy associations (active or ended).
    // We'll perform a "Soft Delete" by marking it inactive and maybe hiding it.

    const { error } = await supabase
      .from("properties")
      .update({ is_active: false }) // Use is_active as soft-delete for properties with history
      .eq("property_id", id);

    if (error) throw error;
    return { softDelete: true }; // Indicate history was preserved
  }

  // 2. If it is vacant and has NO history at all, we can hard delete everything
  const { error: deleteError } = await supabase
    .from("properties")
    .delete()
    .eq("property_id", id);

  if (deleteError) throw deleteError;
  return { softDelete: false };
}

// Tenants
export async function createTenant(
  data: Omit<Tenant, "tenant_id" | "created_at">,
) {
  const { data: result, error } = await supabase
    .from("tenants")
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateTenant(id: number, data: Partial<Tenant>) {
  const { data: result, error } = await supabase
    .from("tenants")
    .update(data)
    .eq("tenant_id", id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Tenancies
export async function createTenancy(
  data: Omit<Tenancy, "tenancy_id" | "created_at">,
) {
  const { data: result, error } = await supabase
    .from("tenancies")
    .insert([data])
    .select()
    .single();

  if (error) throw error;

  // Auto-generate rent payments for the tenancy
  await autoGenerateRentPayments(
    result.tenancy_id,
    data.start_date,
    data.monthly_rent,
  );

  return result;
}

export async function updateTenancy(id: number, data: Partial<Tenancy>) {
  // 1. Get current tenancy to check if critical fields are changing
  const { data: current, error: fetchError } = await supabase
    .from("tenancies")
    .select("start_date, monthly_rent")
    .eq("tenancy_id", id)
    .single();

  if (fetchError) throw fetchError;

  // 2. Perform the update
  const { data: result, error } = await supabase
    .from("tenancies")
    .update(data)
    .eq("tenancy_id", id)
    .select()
    .single();

  if (error) throw error;

  // 3. If start_date or monthly_rent changed, sync rent payments
  const hasStartDateChanged =
    data.start_date && data.start_date !== current.start_date;
  const hasRentChanged =
    data.monthly_rent &&
    parseFloat(data.monthly_rent.toString()) !==
      parseFloat(current.monthly_rent.toString());

  if (hasStartDateChanged || hasRentChanged) {
    await syncRentPayments(id, result.start_date, result.monthly_rent);
  }

  return result;
}

export async function endTenancy(id: number) {
  const today = new Date().toISOString().split("T")[0];
  return updateTenancy(id, {
    end_date: today,
    status: "completed",
  });
}

// Rent Payments
export async function updateRentPayment(
  id: number,
  data: Partial<RentPayment>,
) {
  const { data: result, error } = await supabase
    .from("rent_payments")
    .update(data)
    .eq("rent_id", id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function markRentAsPaid(id: number) {
  const today = new Date().toISOString().split("T")[0];

  // Get current payment to check for rent amount and update remarks
  const { data: payment } = await supabase
    .from("rent_payments")
    .select("rent_amount")
    .eq("rent_id", id)
    .single();

  return updateRentPayment(id, {
    payment_status: "paid",
    paid_date: today,
    remarks: payment ? `Paid: ₹${payment.rent_amount.toLocaleString("en-IN")} | Remaining: ₹0` : "Fully Paid"
  });
}

export async function markRentAsPartial(id: number, remarks?: string) {
  return updateRentPayment(id, {
    payment_status: "partial",
    remarks,
  });
}

// Auto-generate rent payments for a new tenancy
async function autoGenerateRentPayments(
  tenancyId: number,
  startDate: string,
  monthlyRent: number,
) {
  const start = new Date(startDate);
  const now = new Date();

  const startDay = start.getDate();
  const payments: Omit<RentPayment, "rent_id" | "created_at">[] = [];

  // Generate rent for each month where the full month has passed
  // Rent for month X is due on day startDay of month X+1
  // It's "pending" only after the due date has passed

  let currentMonth = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    startDay,
  );

  while (currentMonth <= now) {
    // Only add as pending if this month's rent has become due (today is on or after the due date)
    const dueDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      startDay,
    );

    if (dueDate <= now) {
      // The rent for the previous month (from startDay of prev month to startDay-1 of this month)
      // is now due. Set rent_month to the first day of the month when rent is due
      const rentMonth = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);

      payments.push({
        tenancy_id: tenancyId,
        rent_month: rentMonth.toISOString().split("T")[0],
        rent_amount: monthlyRent,
        payment_status: "pending",
        paid_date: null,
        remarks: "",
      });
    }

    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  if (payments.length > 0) {
    const { error } = await supabase.from("rent_payments").insert(payments);

    if (error) throw error;
  }
}

// Synchronize rent payments when tenancy details change
async function syncRentPayments(
  tenancyId: number,
  startDate: string,
  monthlyRent: number,
) {
  // 1. Delete all existing 'pending' payments
  // We keep 'paid' or 'partial' as they represent real transactions
  const { error: deleteError } = await supabase
    .from("rent_payments")
    .delete()
    .eq("tenancy_id", tenancyId)
    .eq("payment_status", "pending");

  if (deleteError) throw deleteError;

  // 2. Fetch existing 'paid' or 'partial' months to avoid duplicates
  const { data: existing, error: fetchError } = await supabase
    .from("rent_payments")
    .select("rent_month")
    .eq("tenancy_id", tenancyId)
    .neq("payment_status", "pending");

  if (fetchError) throw fetchError;

  const existingMonths = new Set((existing || []).map((p) => p.rent_month));

  // 3. Generate missing pending payments based on new start date
  const start = new Date(startDate);
  const now = new Date();
  const startDay = start.getDate();

  const newPayments: Omit<RentPayment, "rent_id" | "created_at">[] = [];

  let currentMonth = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    startDay,
  );

  while (currentMonth <= now) {
    const dueDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      startDay,
    );

    if (dueDate <= now) {
      const rentMonth = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
      const rentMonthStr = rentMonth.toISOString().split("T")[0];

      // Only add if we don't already have a paid/partial record for this month
      if (!existingMonths.has(rentMonthStr)) {
        newPayments.push({
          tenancy_id: tenancyId,
          rent_month: rentMonthStr,
          rent_amount: monthlyRent,
          payment_status: "pending",
          paid_date: null,
          remarks: "",
        });
      }
    }

    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  if (newPayments.length > 0) {
    const { error: insertError } = await supabase
      .from("rent_payments")
      .insert(newPayments);

    if (insertError) throw insertError;
  }

  // 4. Update 'rent_amount' for existing partial payments if rent changed?
  // (Optional - but usually changing rent doesn't affect past agreements retroactively unless specified)
  // For now, we only update pending rent amounts as they are regenerated.
}

// Dashboard queries
export async function getDashboardMetrics() {
  const { data: properties } = await supabase
    .from("properties")
    .select("property_id", { count: "exact" })
    .eq("is_active", true);

  const { data: occupied } = await supabase
    .from("tenancies")
    .select("tenancy_id, properties!inner(is_active)")
    .is("end_date", null)
    .eq("properties.is_active", true);

  const { data: tenants } = await supabase
    .from("tenants")
    .select("tenant_id", { count: "exact" });

  const { data: pendingRents } = await supabase
    .from("rent_payments")
    .select("rent_amount")
    .neq("payment_status", "paid");

  const totalPending = (pendingRents || []).reduce(
    (sum, r) => sum + (r.rent_amount || 0),
    0,
  );

  return {
    totalProperties: properties?.length || 0,
    occupiedProperties: occupied?.length || 0,
    vacantProperties: (properties?.length || 0) - (occupied?.length || 0),
    totalTenants: tenants?.length || 0,
    totalPendingRent: totalPending,
  };
}

// Documents
export async function getTenancyDocuments(tenancyId: number) {
  const { data, error } = await supabase
    .from("tenancy_documents")
    .select("*")
    .eq("tenancy_id", tenancyId)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;
  return data as TenancyDocument[];
}

export async function uploadTenancyDocument(
  tenancyId: number,
  file: File,
  documentType: string,
) {
  // Validate file size (100MB limit)
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds 100MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`
    );
  }

  try {
    // Convert file to base64 for transmission
    const fileData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1]; // Remove data:application/octet-stream; base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Upload to backend endpoint (uses service role - no RLS issues)
    const uploadResponse = await fetch("/api/documents/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tenancyId,
        documentType,
        fileData,
        fileName: file.name,
        fileType: file.type, // Send the actual file MIME type
      }),
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.message || "Upload failed");
    }

    const uploadResult = await uploadResponse.json();

    if (!uploadResult.success) {
      throw new Error(uploadResult.message || "Upload failed");
    }

    // Store document record in database with signed URL
    const { data, error: dbError } = await supabase
      .from("tenancy_documents")
      .insert([
        {
          tenancy_id: tenancyId,
          file_name: file.name,
          file_path: uploadResult.file.filePath,
          file_size: uploadResult.file.fileSize,
          file_type: file.type,
          document_type: documentType,
          signed_url: uploadResult.file.downloadUrl,
          url_expires_at: new Date(
            Date.now() + uploadResult.file.expiresIn * 1000
          ).toISOString(),
        },
      ])
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred during upload";
    console.error("Document upload error:", errorMessage);
    throw new Error(errorMessage);
  }
}

export async function downloadTenancyDocument(
  document: TenancyDocument
) {
  try {
    // Check if signed URL is still valid
    let downloadUrl = document.signed_url;

    // If URL might be expired, refresh it
    if (document.url_expires_at) {
      const expiresAt = new Date(document.url_expires_at);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();

      // If less than 5 minutes remaining, refresh the URL
      if (timeUntilExpiry < 5 * 60 * 1000) {
        const refreshResponse = await fetch("/api/documents/refresh-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filePath: document.file_path,
          }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          downloadUrl = refreshData.downloadUrl;
        }
      }
    }

    // Use signed URL to download
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error("Failed to download file");
    }

    return await response.blob();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to download document";
    throw new Error(errorMessage);
  }
}

export async function deleteTenancyDocument(
  documentId: number,
  filePath: string,
) {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("tenancy_documents")
    .remove([filePath]);

  if (storageError) throw storageError;

  // Delete from database
  const { error: dbError } = await supabase
    .from("tenancy_documents")
    .delete()
    .eq("document_id", documentId);

  if (dbError) throw dbError;
}
