import { useState, useEffect } from 'react';
import { X, Loader2, FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllReceipts } from '@/services/supabaseAdmin';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import type { Receipt } from '@/types/index';

interface ReceiptWithDetails extends Receipt {
  tenant_name?: string;
  rent_month?: string;
  rent_amount?: number;
}

interface ViewReceiptsModalProps {
  onClose: () => void;
}

export function ViewReceiptsModal({ onClose }: ViewReceiptsModalProps) {
  const [receipts, setReceipts] = useState<ReceiptWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const allReceipts = await getAllReceipts();
        
        // Enrich receipts with payment and tenant details
        const enrichedReceipts = await Promise.all(
          allReceipts.map(async (receipt) => {
            try {
              const { data: payment } = await supabase
                .from('rent_payments')
                .select(`
                  rent_month,
                  rent_amount,
                  tenancies!inner (
                    tenants!inner (
                      name
                    )
                  )
                `)
                .eq('rent_id', receipt.rent_id)
                .single();

              return {
                ...receipt,
                tenant_name: payment?.tenancies?.tenants?.name || 'Unknown',
                rent_month: payment?.rent_month,
                rent_amount: payment?.rent_amount,
              };
            } catch (err) {
              return receipt;
            }
          })
        );

        setReceipts(enrichedReceipts);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Failed to fetch receipts:', errorMessage);
        // Don't show error since table might not exist yet
        // Just show empty state
        setReceipts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, []);

  const handleDownload = async (receipt: ReceiptWithDetails) => {
    try {
      setDownloading(receipt.id);
      const response = await fetch(receipt.download_url);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${receipt.receipt_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast.error('Failed to download receipt');
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMonth = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading receipts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Rent Receipts</h2>
              <p className="text-sm text-slate-500">View and download all generated receipts</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {receipts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No receipts generated yet</p>
              <p className="text-sm text-slate-500">Receipts will appear here once you send payment confirmations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <p className="font-semibold text-slate-900 truncate">
                          {receipt.receipt_number}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs">Tenant</p>
                          <p className="text-slate-900 font-medium truncate">
                            {receipt.tenant_name || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Rent Month</p>
                          <p className="text-slate-900 font-medium">
                            {receipt.rent_month ? formatMonth(receipt.rent_month) : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Amount</p>
                          <p className="text-slate-900 font-medium">
                            {receipt.rent_amount ? `₹${receipt.rent_amount.toLocaleString('en-IN')}` : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Generated</p>
                          <p className="text-slate-900 font-medium">
                            {formatDate(receipt.generated_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(receipt)}
                        disabled={downloading === receipt.id}
                        className="gap-1"
                      >
                        {downloading === receipt.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(receipt.download_url, '_blank')}
                        className="gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
