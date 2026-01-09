import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Property, PropertyWithTenant, Tenancy, Tenant, RentPayment } from '@/types/index';

export function useProperties() {
  const [properties, setProperties] = useState<PropertyWithTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .order('property_id', { ascending: false });

      if (propertiesError) throw propertiesError;

      const enrichedProperties: PropertyWithTenant[] = await Promise.all(
        (propertiesData || []).map(async (property) => {
          const { data: tenancyData } = await supabase
            .from('tenancies')
            .select('*, tenant:tenants(*)')
            .eq('property_id', property.property_id)
            .is('end_date', null)
            .limit(1)
            .single();

          let pending_count = 0;
          if (tenancyData) {
            const { data: rentData } = await supabase
              .from('rent_payments')
              .select('rent_id', { count: 'exact' })
              .eq('tenancy_id', tenancyData.tenancy_id)
              .neq('payment_status', 'paid');

            pending_count = rentData?.length || 0;
          }

          return {
            ...property,
            tenancy: tenancyData || undefined,
            pending_count,
          };
        })
      );

      setProperties(enrichedProperties);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  return { properties, loading, error, refetch: fetchProperties };
}

export function usePropertyDetail(propertyId: number) {
  const [property, setProperty] = useState<Property | null>(null);
  const [tenancy, setTenancy] = useState<Tenancy & { tenant: Tenant } | null>(null);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .eq('property_id', propertyId)
          .single();

        if (propertyError) throw propertyError;
        setProperty(propertyData);

        const { data: tenancyData, error: tenancyError } = await supabase
          .from('tenancies')
          .select('*, tenant:tenants(*)')
          .eq('property_id', propertyId)
          .is('end_date', null)
          .limit(1);

        if (!tenancyError && tenancyData?.length) {
          setTenancy(tenancyData[0]);

          const { data: paymentsData, error: paymentsError } = await supabase
            .from('rent_payments')
            .select('*')
            .eq('tenancy_id', tenancyData[0].tenancy_id)
            .order('rent_month', { ascending: false });

          if (!paymentsError) {
            setRentPayments(paymentsData || []);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch property details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propertyId]);

  return { property, tenancy, rentPayments, loading, error };
}
