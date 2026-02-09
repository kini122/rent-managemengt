import { supabase } from '@/lib/supabaseClient';
import type { Property, Tenant, Tenancy, RentPayment, TenancyDocument } from '@/types/index';

// Properties
export async function createProperty(data: Omit<Property, 'property_id' | 'created_at'>) {
  const { data: result, error } = await supabase
    .from('properties')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateProperty(id: number, data: Partial<Property>) {
  const { data: result, error } = await supabase
    .from('properties')
    .update(data)
    .eq('property_id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deleteProperty(id: number) {
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('property_id', id);

  if (error) throw error;
}

// Tenants
export async function createTenant(data: Omit<Tenant, 'tenant_id' | 'created_at'>) {
  const { data: result, error } = await supabase
    .from('tenants')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateTenant(id: number, data: Partial<Tenant>) {
  const { data: result, error } = await supabase
    .from('tenants')
    .update(data)
    .eq('tenant_id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Tenancies
export async function createTenancy(data: Omit<Tenancy, 'tenancy_id' | 'created_at'>) {
  const { data: result, error } = await supabase
    .from('tenancies')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  
  // Auto-generate rent payments for the tenancy
  await autoGenerateRentPayments(result.tenancy_id, data.start_date, data.monthly_rent);
  
  return result;
}

export async function updateTenancy(id: number, data: Partial<Tenancy>) {
  const { data: result, error } = await supabase
    .from('tenancies')
    .update(data)
    .eq('tenancy_id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function endTenancy(id: number) {
  const today = new Date().toISOString().split('T')[0];
  return updateTenancy(id, { 
    end_date: today,
    status: 'completed'
  });
}

// Rent Payments
export async function updateRentPayment(
  id: number,
  data: Partial<RentPayment>
) {
  const { data: result, error } = await supabase
    .from('rent_payments')
    .update(data)
    .eq('rent_id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function markRentAsPaid(id: number) {
  const today = new Date().toISOString().split('T')[0];
  return updateRentPayment(id, {
    payment_status: 'paid',
    paid_date: today,
  });
}

export async function markRentAsPartial(id: number, remarks?: string) {
  return updateRentPayment(id, {
    payment_status: 'partial',
    remarks,
  });
}

// Auto-generate rent payments for a new tenancy
async function autoGenerateRentPayments(
  tenancyId: number,
  startDate: string,
  monthlyRent: number
) {
  const start = new Date(startDate);
  const now = new Date();

  const startDay = start.getDate();
  const payments: Omit<RentPayment, 'rent_id' | 'created_at'>[] = [];

  // Generate rent for each month where the full month has passed
  // Rent for month X is due on day startDay of month X+1
  // It's "pending" only after the due date has passed

  let currentMonth = new Date(start.getFullYear(), start.getMonth() + 1, startDay);

  while (currentMonth <= now) {
    // Only add as pending if this month's rent has become due (today is on or after the due date)
    const dueDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), startDay);

    if (dueDate <= now) {
      // The rent for the previous month (from startDay of prev month to startDay-1 of this month)
      // is now due. Set rent_month to the first day of the month when rent is due
      const rentMonth = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);

      payments.push({
        tenancy_id: tenancyId,
        rent_month: rentMonth.toISOString().split('T')[0],
        rent_amount: monthlyRent,
        payment_status: 'pending',
        paid_date: null,
        remarks: '',
      });
    }

    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  if (payments.length > 0) {
    const { error } = await supabase
      .from('rent_payments')
      .insert(payments);

    if (error) throw error;
  }
}

// Dashboard queries
export async function getDashboardMetrics() {
  const { data: properties } = await supabase
    .from('properties')
    .select('property_id', { count: 'exact' })
    .eq('is_active', true);

  const { data: occupied } = await supabase
    .from('tenancies')
    .select('tenancy_id', { count: 'exact' })
    .is('end_date', null);

  const { data: tenants } = await supabase
    .from('tenants')
    .select('tenant_id', { count: 'exact' });

  const { data: pendingRents } = await supabase
    .from('rent_payments')
    .select('rent_amount')
    .neq('payment_status', 'paid');

  const totalPending = (pendingRents || []).reduce(
    (sum, r) => sum + (r.rent_amount || 0),
    0
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
    .from('tenancy_documents')
    .select('*')
    .eq('tenancy_id', tenancyId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data as TenancyDocument[];
}

export async function uploadTenancyDocument(
  tenancyId: number,
  file: File,
  documentType: string
) {
  // Create a unique file path
  const fileExt = file.name.split('.').pop();
  const fileName = `${tenancyId}_${Date.now()}.${fileExt}`;
  const filePath = `tenancy_${tenancyId}/${fileName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('tenancy_documents')
    .upload(filePath, file, { upsert: false });

  if (uploadError) throw uploadError;

  // Add document record to database
  const { data, error: dbError } = await supabase
    .from('tenancy_documents')
    .insert([
      {
        tenancy_id: tenancyId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        document_type: documentType,
      },
    ])
    .select()
    .single();

  if (dbError) {
    // Clean up uploaded file if database insert fails
    await supabase.storage.from('tenancy_documents').remove([filePath]);
    throw dbError;
  }

  return data;
}

export async function downloadTenancyDocument(filePath: string) {
  const { data, error } = await supabase.storage
    .from('tenancy_documents')
    .download(filePath);

  if (error) throw error;
  return data;
}

export async function deleteTenancyDocument(documentId: number, filePath: string) {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('tenancy_documents')
    .remove([filePath]);

  if (storageError) throw storageError;

  // Delete from database
  const { error: dbError } = await supabase
    .from('tenancy_documents')
    .delete()
    .eq('document_id', documentId);

  if (dbError) throw dbError;
}
