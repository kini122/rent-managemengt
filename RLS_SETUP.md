# Row Level Security (RLS) Setup Guide

This document explains how to set up Row Level Security (RLS) policies for the Rent Management System in Supabase.

## Overview

RLS policies control who can access and modify data in your Supabase database. This system requires:
- **Admin users**: Full read/write access to all tables
- **Tenant users**: Read-only access to their assigned properties
- **Public access**: Read-only access (optional)

## Prerequisites

1. Supabase project created and configured
2. Database tables created (properties, tenants, tenancies, rent_payments)
3. Authentication enabled in Supabase

## Step 1: Create Admin Role

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Run the following SQL to create a custom admin role:

```sql
-- Create admin role (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin') THEN
    CREATE ROLE admin;
  END IF;
END
$$;

-- Grant privileges to admin role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO admin;
```

## Step 2: Create User Roles Table

Create a table to track which users have admin access:

```sql
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'tenant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own role
CREATE POLICY "Users can read their own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

## Step 3: Set Up Admin Check Function

Create a helper function to check if a user is an admin:

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Step 4: Set Up RLS Policies for Each Table

### Properties Table

```sql
-- Admin: Full access
CREATE POLICY "Admin: Full access to properties"
  ON properties
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- All authenticated users: Read-only
CREATE POLICY "Authenticated users: Read properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (true);
```

### Tenants Table

```sql
-- Admin: Full access
CREATE POLICY "Admin: Full access to tenants"
  ON tenants
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- All authenticated users: Read-only
CREATE POLICY "Authenticated users: Read tenants"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (true);
```

### Tenancies Table

```sql
-- Admin: Full access
CREATE POLICY "Admin: Full access to tenancies"
  ON tenancies
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- All authenticated users: Read-only
CREATE POLICY "Authenticated users: Read tenancies"
  ON tenancies
  FOR SELECT
  TO authenticated
  USING (true);
```

### Rent Payments Table

```sql
-- Admin: Full access
CREATE POLICY "Admin: Full access to rent payments"
  ON rent_payments
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- All authenticated users: Read-only
CREATE POLICY "Authenticated users: Read rent payments"
  ON rent_payments
  FOR SELECT
  TO authenticated
  USING (true);
```

## Step 5: Grant Admin Access to Users

To make a specific user an admin, run:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

Replace `USER_ID_HERE` with the actual UUID from `auth.users` table.

## Step 6: Test RLS Policies

1. Create test users in Supabase Auth
2. Log in with different users and verify:
   - Admin users can create/edit/delete data
   - Non-admin users can only read data

## Current Implementation Notes

The application currently:
- Uses Supabase public/publishable keys (safe for client-side)
- Requires users to authenticate before accessing data
- Admin checks are performed at the database level via RLS policies
- All data operations go through the Supabase client

## Future Enhancements

1. Implement Supabase Auth UI for login/signup
2. Add role-based middleware on the frontend
3. Implement audit logging for all changes
4. Add two-factor authentication for admins
5. Implement data encryption for sensitive fields

## Troubleshooting

### "Permission denied" errors
- Verify the user has the admin role in user_roles table
- Check that RLS policies are correctly defined
- Ensure the user is authenticated

### Policies not working
- Verify RLS is enabled on the table: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- Check policy syntax in the Supabase dashboard
- Review Supabase logs for detailed error messages

## Support

For more information:
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
