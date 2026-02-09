export interface Property {
  property_id: number;
  address: string;
  details: string;
  is_active: boolean;
  created_at: string;
}

export interface Tenant {
  tenant_id: number;
  name: string;
  phone: string;
  id_proof: string;
  notes: string;
  created_at: string;
}

export interface Tenancy {
  tenancy_id: number;
  property_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  advance_amount: number;
  status: 'active' | 'completed' | 'terminated';
  created_at: string;
}

export interface RentPayment {
  rent_id: number;
  tenancy_id: number;
  rent_month: string;
  rent_amount: number;
  payment_status: 'paid' | 'pending' | 'partial';
  paid_date: string | null;
  remarks: string;
  created_at: string;
}

export interface TenancyDocument {
  document_id: number;
  tenancy_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  document_type: string;
  uploaded_at: string;
}

export interface PropertyWithTenant extends Property {
  tenancy?: Tenancy & { tenant: Tenant };
  pending_count: number;
}
