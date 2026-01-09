import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export async function insertSampleData() {
  try {
    // Check if data already exists
    const { data: existingProperties } = await supabase
      .from('properties')
      .select('property_id')
      .limit(1);

    if (existingProperties && existingProperties.length > 0) {
      toast.info('Sample data already exists in the database');
      return;
    }

    // Insert sample properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .insert([
        {
          address: '123 Oak Street, Downtown',
          details: 'Modern 2-bedroom apartment with balcony and parking',
          is_active: true,
        },
        {
          address: '456 Maple Avenue, Suburb',
          details: 'Spacious 3-bedroom house with garden',
          is_active: true,
        },
        {
          address: '789 Pine Road, City Center',
          details: 'Studio apartment, fully furnished',
          is_active: true,
        },
        {
          address: '321 Elm Boulevard, Residential Area',
          details: '2-bedroom duplex with shared parking',
          is_active: true,
        },
      ])
      .select();

    if (propertiesError) throw propertiesError;

    // Insert sample tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .insert([
        {
          name: 'John Smith',
          phone: '555-0101',
          id_proof: 'DL-123456',
          notes: 'Reliable tenant, 3 years rental history',
        },
        {
          name: 'Sarah Johnson',
          phone: '555-0102',
          id_proof: 'PAS-789012',
          notes: 'Professional, prefers long-term lease',
        },
        {
          name: 'Michael Brown',
          phone: '555-0103',
          id_proof: 'DL-345678',
          notes: 'Family of 4, excellent references',
        },
        {
          name: 'Emily Davis',
          phone: '555-0104',
          id_proof: 'PAS-901234',
          notes: 'Student, needs shared accommodation',
        },
      ])
      .select();

    if (tenantsError) throw tenantsError;

    // Create tenancies
    if (properties && tenants) {
      const tenancies = [
        {
          property_id: properties[0].property_id,
          tenant_id: tenants[0].tenant_id,
          start_date: '2023-01-15',
          end_date: null,
          monthly_rent: 12000,
          advance_amount: 24000,
          status: 'active' as const,
        },
        {
          property_id: properties[1].property_id,
          tenant_id: tenants[1].tenant_id,
          start_date: '2023-06-01',
          end_date: null,
          monthly_rent: 18000,
          advance_amount: 36000,
          status: 'active' as const,
        },
        {
          property_id: properties[2].property_id,
          tenant_id: tenants[2].tenant_id,
          start_date: '2024-01-10',
          end_date: null,
          monthly_rent: 8000,
          advance_amount: 16000,
          status: 'active' as const,
        },
      ];

      const { data: createdTenancies, error: tenanciesError } = await supabase
        .from('tenancies')
        .insert(tenancies)
        .select();

      if (tenanciesError) throw tenanciesError;

      // Auto-generate rent payments for created tenancies
      if (createdTenancies) {
        for (const tenancy of createdTenancies) {
          const start = new Date(tenancy.start_date);
          const now = new Date();

          const payments = [];
          const current = new Date(start);
          current.setHours(0, 0, 0, 0);

          while (current <= now) {
            const rentMonth = new Date(current.getFullYear(), current.getMonth(), 1);
            payments.push({
              tenancy_id: tenancy.tenancy_id,
              rent_month: rentMonth.toISOString().split('T')[0],
              rent_amount: tenancy.monthly_rent,
              payment_status: Math.random() > 0.3 ? 'paid' : 'pending',
              paid_date:
                Math.random() > 0.3 ? rentMonth.toISOString().split('T')[0] : null,
              remarks: '',
            });

            current.setMonth(current.getMonth() + 1);
          }

          const { error: paymentsError } = await supabase
            .from('rent_payments')
            .insert(payments);

          if (paymentsError) throw paymentsError;
        }
      }
    }

    toast.success('Sample data created successfully!');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to create sample data');
  }
}
