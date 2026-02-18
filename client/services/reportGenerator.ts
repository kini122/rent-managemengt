import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';
import type { Property, Tenancy, Tenant, RentPayment } from '@/types/index';

export type ReportType = 'full' | 'yearly' | 'monthly';

export async function generateGlobalReport(type: ReportType, year?: number, month?: number) {
  try {
    // 1. Fetch All Data
    const { data: properties } = await supabase.from('properties').select('*');
    const { data: tenants } = await supabase.from('tenants').select('*');
    const { data: tenancies } = await supabase.from('tenancies').select('*, tenant:tenants(*), property:properties(*)');
    const { data: payments } = await supabase.from('rent_payments').select('*, tenancy:tenancies(*, tenant:tenants(*), property:properties(*))');
    const { data: documents } = await supabase.from('tenancy_documents').select('*, tenancy:tenancies(*, tenant:tenants(*), property:properties(*))');

    if (!properties || !tenants || !tenancies || !payments || !documents) {
      throw new Error('Failed to fetch data for report');
    }

    // 2. Filter data based on report type if needed
    let filteredPayments = payments;
    let reportTitle = "Full System Report";

    if (type === 'yearly' && year) {
      filteredPayments = payments.filter(p => {
        const d = new Date(p.rent_month);
        return d.getFullYear() === year;
      });
      reportTitle = `Yearly Report - ${year}`;
    } else if (type === 'monthly' && year && month !== undefined) {
      filteredPayments = payments.filter(p => {
        const d = new Date(p.rent_month);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      const monthName = new Date(year, month).toLocaleString('en-GB', { month: 'long' });
      reportTitle = `Monthly Report - ${monthName} ${year}`;
    }

    // 3. Prepare Sheets
    const wb = XLSX.utils.book_new();

    // Sheet: Properties
    const propRows = properties.map(p => ({
      ID: p.property_id,
      Address: p.address,
      Details: p.details,
      Status: p.is_active ? 'Active' : 'Inactive',
      'Created At': new Date(p.created_at).toLocaleString('en-GB')
    }));
    const wsProps = XLSX.utils.json_to_sheet(propRows);
    XLSX.utils.book_append_sheet(wb, wsProps, "Properties");

    // Sheet: Tenants
    const tenantRows = tenants.map(t => ({
      ID: t.tenant_id,
      Name: t.name,
      Phone: t.phone,
      'ID Proof': t.id_proof,
      Notes: t.notes,
      'Created At': new Date(t.created_at).toLocaleString('en-GB')
    }));
    const wsTenants = XLSX.utils.json_to_sheet(tenantRows);
    XLSX.utils.book_append_sheet(wb, wsTenants, "Tenants");

    // Sheet: Active/Ended Tenancies
    const tenancyRows = tenancies.map(t => ({
      ID: t.tenancy_id,
      Property: (t as any).property?.address || 'Deleted Property',
      Tenant: (t as any).tenant?.name || 'Deleted Tenant',
      'Monthly Rent': t.monthly_rent,
      'Advance Amount': t.advance_amount,
      'Start Date': new Date(t.start_date).toLocaleDateString('en-GB'),
      'End Date': t.end_date ? new Date(t.end_date).toLocaleDateString('en-GB') : 'Active',
      Status: t.status.toUpperCase()
    }));
    const wsTenancies = XLSX.utils.json_to_sheet(tenancyRows);
    XLSX.utils.book_append_sheet(wb, wsTenancies, "Tenancies");

    // Sheet: Rent History (Detailed)
    const historyRows = filteredPayments.map(p => {
      let pendingAmount = 0;
      if (p.payment_status === 'pending') {
        pendingAmount = p.rent_amount;
      } else if (p.payment_status === 'partial' && p.remarks) {
        const match = p.remarks.match(/Remaining:\s*₹?([\d,]+)/);
        if (match) pendingAmount = parseInt(match[1].replace(/,/g, ''), 10);
      }

      return {
        'Rent ID': p.rent_id,
        Property: (p as any).tenancy?.property?.address || '-',
        Tenant: (p as any).tenancy?.tenant?.name || '-',
        Month: new Date(p.rent_month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
        'Total Rent': p.rent_amount,
        Status: p.payment_status.toUpperCase(),
        'Pending Amount': pendingAmount,
        'Paid Date': p.paid_date ? new Date(p.paid_date).toLocaleDateString('en-GB') : '-',
        Remarks: p.remarks || '-'
      };
    });
    const wsHistory = XLSX.utils.json_to_sheet(historyRows);
    XLSX.utils.book_append_sheet(wb, wsHistory, "Rent Payments");

    // Sheet: Pending Dues Only
    const pendingRows = filteredPayments
      .filter(p => p.payment_status !== 'paid')
      .map(p => {
        let outstanding = p.rent_amount;
        if (p.payment_status === 'partial' && p.remarks) {
          const match = p.remarks.match(/Remaining:\s*₹?([\d,]+)/);
          if (match) outstanding = parseInt(match[1].replace(/,/g, ''), 10);
        }
        return {
          Property: (p as any).tenancy?.property?.address || '-',
          Tenant: (p as any).tenancy?.tenant?.name || '-',
          Month: new Date(p.rent_month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
          'Total Amount': p.rent_amount,
          'Pending Balance': outstanding,
          Status: p.payment_status.toUpperCase(),
          Remarks: p.remarks || '-'
        };
      });
    const wsPending = XLSX.utils.json_to_sheet(pendingRows);
    XLSX.utils.book_append_sheet(wb, wsPending, "Pending Dues");

    // Sheet: Documents
    const docRows = (documents || []).map(d => ({
      'Document ID': d.document_id,
      Property: (d as any).tenancy?.property?.address || '-',
      Tenant: (d as any).tenancy?.tenant?.name || '-',
      'File Name': d.file_name,
      Type: d.document_type,
      Size: `${(d.file_size / 1024).toFixed(2)} KB`,
      'Uploaded At': new Date(d.uploaded_at).toLocaleString('en-GB')
    }));
    const wsDocs = XLSX.utils.json_to_sheet(docRows);
    XLSX.utils.book_append_sheet(wb, wsDocs, "Documents");

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${reportTitle.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(wb, fileName);
    return true;
  } catch (err) {
    console.error('Global report generation error:', err);
    throw err;
  }
}
