import { useState, useEffect } from "react";
import type { TenancyDocument } from "@/types/index";
import {
  getTenancyDocuments,
  uploadTenancyDocument,
  downloadTenancyDocument,
  deleteTenancyDocument,
} from "@/services/supabaseAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp, Download, Trash2, Loader2, File } from "lucide-react";
import { toast } from "sonner";

export interface TenancyDocumentsProps {
  tenancyId: number;
}

const DOCUMENT_TYPES = [
  "Agreement",
  "ID Proof",
  "Address Proof",
  "Income Proof",
  "Utility Bill",
  "Bank Statement",
  "Deposit Receipt",
  "Other",
];

export function TenancyDocuments({ tenancyId }: TenancyDocumentsProps) {
  const [documents, setDocuments] = useState<TenancyDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState("Agreement");

  useEffect(() => {
    loadDocuments();
  }, [tenancyId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await getTenancyDocuments(tenancyId);
      setDocuments(data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load documents",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await uploadTenancyDocument(tenancyId, file, selectedType);
      toast.success("Document uploaded successfully");
      await loadDocuments();
      // Reset input
      e.target.value = "";
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload document",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: TenancyDocument) => {
    try {
      const blob = await downloadTenancyDocument(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to download document",
      );
    }
  };

  const handleDelete = async (document: TenancyDocument) => {
    if (!confirm(`Are you sure you want to delete ${document.file_name}?`)) {
      return;
    }

    try {
      await deleteTenancyDocument(document.document_id, document.file_path);
      toast.success("Document deleted successfully");
      await loadDocuments();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete document",
      );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-6">
        Tenancy Documents
      </h3>

      {/* Upload Section */}
      <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="space-y-3">
          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="document-upload"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
            />
            <label htmlFor="document-upload">
              <Button
                asChild
                className="w-full gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700"
                disabled={uploading}
              >
                <span>
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FileUp className="w-4 h-4" />
                      Upload Document
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <File className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((document) => (
              <div
                key={document.document_id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {document.file_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="px-2 py-0.5 bg-slate-100 rounded">
                          {document.document_type}
                        </span>
                        <span>{(document.file_size / 1024).toFixed(2)} KB</span>
                        <span>
                          {new Date(document.uploaded_at).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(document)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(document)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
