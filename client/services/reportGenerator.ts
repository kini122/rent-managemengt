import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';

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

    const wb = XLSX.utils.book_new();

    // --- SHEET 1: SYSTEM OVERVIEW ---
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
      ["SYSTEM-WIDE RENTAL MANAGEMENT REPORT"],
      ["Report Type:", reportTitle],
      ["Generated on:", new Date().toLocaleString("en-GB")],
      [],
      ["OVERALL STATISTICS"],
      ["Total Properties:", properties.length],
      ["Total Tenants:", tenants.length],
      ["Active Tenancies:", tenancies.filter(t => !t.end_date).length],
      ["Total Rent Collected (All Time):", `₹${totalPaid.toLocaleString("en-IN")}`],
      ["Total Outstanding Dues:", `₹${totalPending.toLocaleString("en-IN")}`],
      [],
      ["DISCLAIMER"],
      ["This report contains sensitive financial and personal data."],
      ["Please handle with appropriate care and security."],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Overview");

    // --- SHEET 2: PROPERTIES (Detailed) ---
    const propRows = properties.map(p => ({
      'Property ID': p.property_id,
      'Address': p.address,
      'Details': p.details || '-',
      'Is Active': p.is_active ? 'YES' : 'NO',
      'Created At': new Date(p.created_at).toLocaleString('en-GB')
    }));
    const wsProps = XLSX.utils.json_to_sheet(propRows);
    XLSX.utils.book_append_sheet(wb, wsProps, "Properties");

    // --- SHEET 3: TENANTS (Detailed) ---
    const tenantRows = tenants.map(t => ({
      'Tenant ID': t.tenant_id,
      'Name': t.name,
      'Phone Number': t.phone,
      'ID Proof Detail': t.id_proof || '-',
      'Personal Notes': t.notes || '-',
      'Registered At': new Date(t.created_at).toLocaleString('en-GB')
    }));
    const wsTenants = XLSX.utils.json_to_sheet(tenantRows);
    XLSX.utils.book_append_sheet(wb, wsTenants, "Tenants");

    // --- SHEET 4: TENANCIES (Detailed) ---
    const tenancyRows = tenancies.map(t => ({
      'Tenancy ID': t.tenancy_id,
      'Property Address': (t as any).property?.address || 'N/A',
      'Tenant Name': (t as any).tenant?.name || 'N/A',
      'Monthly Rent Amount': t.monthly_rent,
      'Advance/Deposit': t.advance_amount,
      'Start Date': new Date(t.start_date).toLocaleDateString('en-GB'),
      'End Date': t.end_date ? new Date(t.end_date).toLocaleDateString('en-GB') : 'Ongoing (Active)',
      'Current Status': t.status.toUpperCase(),
      'Agreement Created': new Date(t.created_at).toLocaleString('en-GB'),
      'Property ID': t.property_id,
      'Tenant ID': t.tenant_id
    }));
    const wsTenancies = XLSX.utils.json_to_sheet(tenancyRows);
    XLSX.utils.book_append_sheet(wb, wsTenancies, "Tenancies");

    // --- SHEET 5: RENT PAYMENTS (Full History) ---
    const sortedPayments = [...filteredPayments].sort((a, b) => 
      new Date(b.rent_month).getTime() - new Date(a.rent_month).getTime()
    );

    const historyRows = sortedPayments.map(p => {
      let pendingAmount = 0;
      if (p.payment_status === 'pending') {
        pendingAmount = p.rent_amount;
      } else if (p.payment_status === 'partial' && p.remarks) {
        const match = p.remarks.match(/Remaining:\s*₹?([\d,]+)/);
        if (match) pendingAmount = parseInt(match[1].replace(/,/g, ''), 10);
      }

      return {
        'Rent Record ID': p.rent_id,
        'Property': (p as any).tenancy?.property?.address || '-',
        'Tenant': (p as any).tenancy?.tenant?.name || '-',
        'Rent Month': new Date(p.rent_month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
        'Expected Rent': p.rent_amount,
        'Payment Status': p.payment_status.toUpperCase(),
        'Pending Balance': pendingAmount > 0 ? pendingAmount : 0,
        'Actual Paid Date': p.paid_date ? new Date(p.paid_date).toLocaleDateString('en-GB') : 'Not Paid',
        'Remarks/Notes': p.remarks || '-',
        'Record Created At': new Date(p.created_at).toLocaleString('en-GB'),
        'Tenancy ID': p.tenancy_id
      };
    });
    const wsHistory = XLSX.utils.json_to_sheet(historyRows);
    XLSX.utils.book_append_sheet(wb, wsHistory, "Rent Payments");

    // --- SHEET 6: PENDING DUES (Specific Reconciliation) ---
    const pendingRows = filteredPayments
      .filter(p => p.payment_status !== 'paid')
      .map(p => {
        let outstanding = p.rent_amount;
        if (p.payment_status === 'partial' && p.remarks) {
          const match = p.remarks.match(/Remaining:\s*₹?([\d,]+)/);
          if (match) outstanding = parseInt(match[1].replace(/,/g, ''), 10);
        }
        return {
          'Property': (p as any).tenancy?.property?.address || '-',
          'Tenant': (p as any).tenancy?.tenant?.name || '-',
          'Dues For Month': new Date(p.rent_month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
          'Standard Monthly Rent': p.rent_amount,
          'Current Pending Balance': outstanding,
          'Status': p.payment_status.toUpperCase(),
          'Payment History Notes': p.remarks || '-'
        };
      });
    const wsPending = XLSX.utils.json_to_sheet(pendingRows);
    XLSX.utils.book_append_sheet(wb, wsPending, "Pending Dues");

    // --- SHEET 7: DOCUMENTS (Audit Trail) ---
    const docRows = (documents || []).map(d => ({
      'Document ID': d.document_id,
      'Linked Property': (d as any).tenancy?.property?.address || '-',
      'Linked Tenant': (d as any).tenancy?.tenant?.name || '-',
      'File Name': d.file_name,
      'Document Category': d.document_type,
      'File Extension': d.file_type || d.file_name.split('.').pop() || 'unknown',
      'Size (KB)': (d.file_size / 1024).toFixed(2),
      'Upload Date & Time': new Date(d.uploaded_at).toLocaleString('en-GB'),
      'Storage Path': d.file_path,
      'Tenancy ID': d.tenancy_id
    }));
    const wsDocs = XLSX.utils.json_to_sheet(docRows);
    XLSX.utils.book_append_sheet(wb, wsDocs, "Documents");

    // --- FINAL FORMATTING ---
    const colWidths = [
      { wch: 15 }, { wch: 40 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 40 }, { wch: 15 }
    ];
    [wsProps, wsTenants, wsTenancies, wsHistory, wsPending, wsDocs].forEach(ws => {
      ws['!cols'] = colWidths;
    });
    wsSummary['!cols'] = [{ wch: 35 }, { wch: 45 }];

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${reportTitle.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

    // Export
    XLSX.writeFile(wb, fileName);
    return true;
  } catch (err) {
    console.error('Global report generation error:', err);
    throw err;
  }
}
