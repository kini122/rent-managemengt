/**
 * Utility to detect Row Level Security (RLS) violations
 * RLS errors typically contain "violates row level security policy"
 */

export function isRLSError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.toLowerCase().includes('row level security') ||
    message.toLowerCase().includes('violates') ||
    message.includes('new row violates') ||
    message.includes('policy')
  );
}

export function getRLSErrorMessage(): string {
  return (
    'Database security configuration is required. ' +
    'Please visit the setup page to configure Row Level Security (RLS) policies.'
  );
}

/**
 * Wraps a Supabase operation and throws a user-friendly error if RLS is the issue
 */
export async function withRLSCheck<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const result = await operation();

  if (result.error) {
    if (isRLSError(result.error)) {
      const error = new Error(getRLSErrorMessage());
      (error as any).code = 'RLS_ERROR';
      throw error;
    }
    throw result.error;
  }

  return result.data as T;
}
