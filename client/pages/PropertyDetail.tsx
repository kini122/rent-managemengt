import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { usePropertyDetail } from "@/hooks/useSupabase";
import { TenantSummary } from "@/components/TenantSummary";
import { RentTable } from "@/components/RentTable";
import { CreateTenancyModal } from "@/components/CreateTenancyModal";
import { PendingRentDetails } from "@/components/PendingRentDetails";
import { TenancyDocuments } from "@/components/TenancyDocuments";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { markRentAsPaid, deleteProperty } from "@/services/supabaseAdmin";
import { toast } from "sonner";

export default function PropertyDetail() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const propId = propertyId ? parseInt(propertyId) : 0;

  const { property, tenancy, rentPayments, loading, error, refetch } =
    usePropertyDetail(propId);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTenancyModal, setShowTenancyModal] = useState(false);

  const handleMarkRentAsPaid = async (rentId: number) => {
    try {
      setIsMarkingPaid(true);
      await markRentAsPaid(rentId);
      toast.success("Rent marked as paid");
      await refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to mark rent as paid",
      );
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleDeleteProperty = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${property?.address}"? This will also delete all associated tenancies, rent payments, and documents. This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteProperty(propId);
      toast.success("Property deleted successfully");
      navigate("/");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete property",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading property details...</span>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium">
              {error || "Property not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Properties
              </Button>
              <h1 className="text-3xl font-bold text-slate-900">
                Property Details
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={handleDeleteProperty}
              disabled={isDeleting}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-2 self-start sm:self-center"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete Property
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Top Half: Property + Tenant Summary */}
          <TenantSummary
            property={property}
            tenancy={tenancy}
            onEdit={refetch}
            onCreateTenancy={() => setShowTenancyModal(true)}
            onTenancyEnded={() => {
              refetch();
              toast.success("Tenancy has been ended");
            }}
          />

          {/* Bottom Half: Rent Payments Table */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Rent Payment History
            </h2>
            <RentTable
              payments={rentPayments}
              onMarkPaid={handleMarkRentAsPaid}
              onRefresh={refetch}
              isEditable={true}
            />
          </div>

          {/* Pending & Partial Rent Details */}
          <PendingRentDetails
            payments={rentPayments}
            tenantName={tenancy?.tenant.name}
            tenantPhone={tenancy?.tenant.phone}
            propertyAddress={property.address}
          />

          {/* Tenancy Documents - MOVED TO LAST */}
          {tenancy && <TenancyDocuments tenancyId={tenancy.tenancy_id} />}
        </div>

        {/* Create Tenancy Modal */}
        <CreateTenancyModal
          propertyId={propId}
          isOpen={showTenancyModal}
          onClose={() => setShowTenancyModal(false)}
          onSuccess={refetch}
        />
      </div>
    </div>
  );
}
