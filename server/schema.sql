-- Create properties table
CREATE TABLE properties (
  property_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  address TEXT NOT NULL,
  details TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tenants table
CREATE TABLE tenants (
  tenant_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  phone TEXT,
  id_proof TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tenancies table
CREATE TABLE tenancies (
  tenancy_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  property_id BIGINT NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
  tenant_id BIGINT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rent DECIMAL(10, 2) NOT NULL,
  advance_amount DECIMAL(10, 2) DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'completed', 'terminated')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rent_payments table
CREATE TABLE rent_payments (
  rent_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  tenancy_id BIGINT NOT NULL REFERENCES tenancies(tenancy_id) ON DELETE CASCADE,
  rent_month DATE NOT NULL,
  rent_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('paid', 'pending', 'partial')) DEFAULT 'pending',
  paid_date DATE,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tenancy_documents table
CREATE TABLE tenancy_documents (
  document_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  tenancy_id BIGINT NOT NULL REFERENCES tenancies(tenancy_id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  document_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tenancies_property_id ON tenancies(property_id);
CREATE INDEX idx_tenancies_tenant_id ON tenancies(tenant_id);
CREATE INDEX idx_rent_payments_tenancy_id ON rent_payments(tenancy_id);
CREATE INDEX idx_rent_payments_status ON rent_payments(payment_status);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;

-- Create policies allowing public access (MVP - no authentication required)
-- Properties table policies
CREATE POLICY "Allow public read on properties" ON properties
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on properties" ON properties
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on properties" ON properties
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on properties" ON properties
  FOR DELETE USING (true);

-- Tenants table policies
CREATE POLICY "Allow public read on tenants" ON tenants
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on tenants" ON tenants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on tenants" ON tenants
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on tenants" ON tenants
  FOR DELETE USING (true);

-- Tenancies table policies
CREATE POLICY "Allow public read on tenancies" ON tenancies
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on tenancies" ON tenancies
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on tenancies" ON tenancies
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on tenancies" ON tenancies
  FOR DELETE USING (true);

-- Rent_payments table policies
CREATE POLICY "Allow public read on rent_payments" ON rent_payments
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on rent_payments" ON rent_payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on rent_payments" ON rent_payments
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on rent_payments" ON rent_payments
  FOR DELETE USING (true);
