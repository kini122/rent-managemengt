import { useEffect, useState } from 'react';

/**
 * Hook to initialize Supabase storage bucket on app load
 * Ensures the tenancy_documents bucket exists before trying to upload files
 */
export function useStorageInit() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initStorage = async () => {
      try {
        const response = await fetch('/api/init-storage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Failed to initialize storage (${response.status})`
          );
        }

        const data = await response.json();
        console.log('Storage initialization:', data);
        setInitialized(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Storage initialization error:', errorMessage);
        setError(errorMessage);
      }
    };

    initStorage();
  }, []);

  return { initialized, error };
}
