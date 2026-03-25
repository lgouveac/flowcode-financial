-- =============================================
-- Migration: Role-based access control (RBAC)
-- Adds role field to profiles for permission management
-- =============================================

-- 1. Add role column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'employee'
  CHECK (role IN ('admin', 'financial', 'employee'));

-- 2. Set existing users as admin (you can adjust this after migration)
-- UPDATE profiles SET role = 'admin' WHERE id IN ('your-admin-user-id-here');

-- 3. RLS: employees can only read their own profile
-- (keep existing policies, just add role-aware ones)

-- Allow all authenticated users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update any profile (for role assignment)
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow users to update their own profile (but not role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 4. Cleanup: remove project_access-based policies if they were already created
-- (All employees see all projects — role only controls which pages are visible)
DROP POLICY IF EXISTS "Employees see assigned projects" ON projetos;
DROP POLICY IF EXISTS "Employees see assigned project tasks" ON project_tasks;
