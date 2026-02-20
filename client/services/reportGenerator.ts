import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';

export type ReportType = 'full' | 'yearly' | 'monthly';

export async function generateGlobalReport(type: ReportType, year?: number, month?: number) {
  try {
    // 1. Fetch All Data Exhaustively
    const { data: properties } = await supabase.from('properties').select('*').order('property_id', { ascending: true });
    const { data: tenants } = await supabase.from('tenants').select('*').order('tenant_id', { ascending: true });
    const { data: tenancies } = await supabase.from('tenancies').select('*, tenant:tenants(*), property:properties(*)').order('tenancy_id', { ascending: true });
    const { data: payments } = await supabase.from('rent_payments').select('*, tenancy:tenancies(*, tenant:tenants(*), property:properties(*))').order('rent_month', { ascending: false });
    const { data: documents } = await supabase.from('tenancy_documents').select('*, tenancy:tenancies(*, tenant:tenants(*), property:properties(*))').order('uploaded_at', { ascending: false });

    if (!properties || !tenants || !tenancies || !payments || !documents) {
      throw new Error('Failed to fetch data for report');
    }

    // 2. Filter data based on report type if needed (Only affects filtered sheets)
    let filteredPayments = payments;
    let reportTitle = "Full System Audit Report";

    if (type === 'yearly' && year) {
      filteredPayments = payments.filter(p => {
        const d = new Date(p.rent_month);
        return d.getFullYear() === year;
      });
      reportTitle = `Yearly Audit Report - ${year}`;
    } else if (type === 'monthly' && year && month !== undefined) {
      filteredPayments = payments.filter(p => {
        const d = new Date(p.rent_month);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      const monthName = new Date(year, month).toLocaleString('en-GB', { month: 'long' });
      reportTitle = `Monthly Audit Report - ${monthName} ${year}`;
    }

    const wb = XLSX.utils.book_new();

    // --- SHEET 1: MASTER AUDIT LOG (FLATTENED - EVERY MINUTE DETAIL) ---
    // This sheet joins every payment with its full tenancy, tenant, and property details
    const masterRows = filteredPayments.map(p => {
      const t = (p as any).tenancy || {};
      const tenant = t.tenant || {};
      const prop = t.property || {};

      let pendingAmount = 0;
      if (p.payment_status === 'pending') {
        pendingAmount = p.rent_amount;
      } else if (p.payment_status === 'partial' && p.remarks) {
        const match = p.remarks.match(/Remaining:\s*₹?([\d,]+)/);
        if (match) pendingAmount = parseInt(match[1].replace(/,/g, ''), 10);
      }

      return {
        'Rent Payment ID': p.rent_id,
        'Rent Month': new Date(p.rent_month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
        'Payment Status': p.payment_status.toUpperCase(),
        'Rent Amount Due': p.rent_amount,
        'Pending Balance': pendingAmount,
        'Date Paid': p.paid_date ? new Date(p.paid_date).toLocaleDateString('en-GB') : 'NOT PAID',
        'Payment Remarks': p.remarks || '-',
        'Payment Record Created': new Date(p.created_at).toLocaleString('en-GB'),
        
        'Tenancy ID': t.tenancy_id || '-',
        'Tenancy Start Date': t.start_date ? new Date(t.start_date).toLocaleDateString('en-GB') : '-',
        'Tenancy End Date': t.end_date ? new Date(t.end_date).toLocaleDateString('en-GB') : 'ACTIVE',
        'Standard Monthly Rent': t.monthly_rent || '-',
        'Advance/Security Deposit': t.advance_amount || '-',
        'Tenancy Status': (t.status || '-').toUpperCase(),
        
        'Tenant ID': tenant.tenant_id || '-',
        'Tenant Name': tenant.name || '-',
        'Tenant Phone': tenant.phone || '-',
        'Tenant ID Proof': tenant.id_proof || '-',
        'Tenant Notes': tenant.notes || '-',
        
        'Property ID': prop.property_id || '-',
        'Property Address': prop.address || '-',
        'Property Details': prop.details || '-',
        'Property Is Active': prop.is_active ? 'YES' : 'NO'
      };
    });
    const wsMaster = XLSX.utils.json_to_sheet(masterRows);
    XLSX.utils.book_append_sheet(wb, wsMaster, "MASTER AUDIT LOG");

    // --- SHEET 2: ALL TENANCIES (Exhaustive) ---
    const tenancyRows = tenancies.map(t => ({
      'Tenancy ID': t.tenancy_id,
      'Property ID': t.property_id,
      'Property Address': (t as any).property?.address || 'N/A',
      'Tenant ID': t.tenant_id,
      'Tenant Name': (t as any).tenant?.name || 'N/A',
      'Tenant Phone': (t as any).tenant?.phone || 'N/A',
      'Monthly Rent': t.monthly_rent,
      'Advance Amount': t.advance_amount,
      'Start Date': new Date(t.start_date).toLocaleDateString('en-GB'),
      'End Date': t.end_date ? new Date(t.end_date).toLocaleDateString('en-GB') : 'ACTIVE',
      'Tenancy Status': t.status.toUpperCase(),
      'Record Created At': new Date(t.created_at).toLocaleString('en-GB')
    }));
    const wsTenancies = XLSX.utils.json_to_sheet(tenancyRows);
    XLSX.utils.book_append_sheet(wb, wsTenancies, "ALL TENANCIES");

    // --- SHEET 3: ALL RENT PAYMENTS (Full History) ---
    const historyRows = filteredPayments.map(p => ({
      'Payment ID': p.rent_id,
      'Tenancy ID': p.tenancy_id,
      'Property': (p as any).tenancy?.property?.address || '-',
      'Tenant': (p as any).tenancy?.tenant?.name || '-',
      'Rent Month': new Date(p.rent_month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      'Amount Due': p.rent_amount,
      'Status': p.payment_status.toUpperCase(),
      'Paid Date': p.paid_date ? new Date(p.paid_date).toLocaleDateString('en-GB') : '-',
      'Remarks': p.remarks || '-',
      'Created At': new Date(p.created_at).toLocaleString('en-GB')
    }));
    const wsHistory = XLSX.utils.json_to_sheet(historyRows);
    XLSX.utils.book_append_sheet(wb, wsHistory, "ALL RENT PAYMENTS");

    // --- SHEET 4: ALL PROPERTIES ---
    const propRows = properties.map(p => ({
      'Property ID': p.property_id,
      'Address': p.address,
      'Details': p.details || '-',
      'Is Active': p.is_active ? 'YES' : 'NO',
      'Registered At': new Date(p.created_at).toLocaleString('en-GB')
    }));
    const wsProps = XLSX.utils.json_to_sheet(propRows);
    XLSX.utils.book_append_sheet(wb, wsProps, "ALL PROPERTIES");

    // --- SHEET 5: ALL TENANTS ---
    const tenantRows = tenants.map(t => ({
      'Tenant ID': t.tenant_id,
      'Full Name': t.name,
      'Phone Number': t.phone,
      'ID Proof Info': t.id_proof || '-',
      'Internal Notes': t.notes || '-',
      'Joined At': new Date(t.created_at).toLocaleString('en-GB')
    }));
    const wsTenants = XLSX.utils.json_to_sheet(tenantRows);
    XLSX.utils.book_append_sheet(wb, wsTenants, "ALL TENANTS");

    // --- SHEET 6: ALL DOCUMENTS ---
    const docRows = documents.map(d => ({
      'Document ID': d.document_id,
      'Tenancy ID': d.tenancy_id,
      'Property': (d as any).tenancy?.property?.address || '-',
      'Tenant': (d as any).tenancy?.tenant?.name || '-',
      'File Name': d.file_name,
      'Document Type': d.document_type,
      'File Size (KB)': (d.file_size / 1024).toFixed(2),
      'Upload Timestamp': new Date(d.uploaded_at).toLocaleString('en-GB'),
      'Storage Path': d.file_path
    }));
    const wsDocs = XLSX.utils.json_to_sheet(docRows);
    XLSX.utils.book_append_sheet(wb, wsDocs, "ALL DOCUMENTS");

    // --- SHEET 7: FINANCIAL SUMMARY ---
    const totalPaid = payments.filter(p => p.payment_status === 'paid').reduce((sum, p) => sum + p.rent_amount, 0);
    const totalPending = payments.reduce((sum, p) => {
      if (p.payment_status === 'paid') return sum;
      let amt = p.rent_amount;
      if (p.payment_status === 'partial' && p.remarks) {
        const match = p.remarks.match(/Remaining:\s*₹?([\d,]+)/);
        if (match) amt = parseInt(match[1].replace(/,/g, ''), 10);
      }
      return sum + amt;
    }, 0);

    const summaryRows = [
      ["EXHAUSTIVE FINANCIAL AUDIT REPORT"],
      ["Report Scope:", reportTitle],
      ["Generated Date:", new Date().toLocaleString("en-GB")],
      [],
      ["AGGREGATE METRICS"],
      ["Grand Total Properties:", properties.length],
      ["Grand Total Tenants:", tenants.length],
      ["Grand Total Tenancies:", tenancies.length],
      ["Active Tenancies:", tenancies.filter(t => !t.end_date).length],
      [],
      ["REVENUE SUMMARY (SYSTEM-WIDE)"],
      ["Total Rent Realized:", `₹${totalPaid.toLocaleString("en-IN")}`],
      ["Total Outstanding Balance:", `₹${totalPending.toLocaleString("en-IN")}`],
      ["Total Possible Revenue:", `₹${(totalPaid + totalPending).toLocaleString("en-IN")}`],
      [],
      ["END OF REPORT"]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "FINANCIAL SUMMARY");

    // Column resizing for all sheets
    const stdWidths = [{ wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 40 }, { wch: 25 }];
    [wsMaster, wsTenancies, wsHistory, wsProps, wsTenants, wsDocs].forEach(ws => {
      ws['!cols'] = stdWidths;
    });
    wsMaster['!cols'] = Array(20).fill({ wch: 20 }); // Wider for master log

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const fileName = `${reportTitle.replace(/\s+/g, '_')}_EXHAUSTIVE_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(wb, fileName);
    return true;
  } catch (err) {
    console.error('Exhaustive report generation error:', err);
    throw err;
  }
}
