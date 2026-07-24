-- Migration: 014_fix_rls_recursion.sql
-- Fix RLS infinite recursion on public.users and related tables

-- 1. Create SECURITY DEFINER function to fetch user role safely without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- 2. Drop existing problematic RLS policies on users table
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_update_admin" ON public.users;
DROP POLICY IF EXISTS "users_insert_public" ON public.users;

-- Re-create clean RLS policies on users table
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = auth_user_id OR public.get_my_role() = 'admin');

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = auth_user_id OR public.get_my_role() = 'admin')
  WITH CHECK (auth.uid() = auth_user_id OR public.get_my_role() = 'admin');

CREATE POLICY "users_insert_public" ON public.users
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = auth_user_id);

-- 3. Drop and recreate RLS policies on dealers table
DROP POLICY IF EXISTS "dealers_select_admin" ON public.dealers;
DROP POLICY IF EXISTS "dealers_update_admin" ON public.dealers;

CREATE POLICY "dealers_select_admin" ON public.dealers
  FOR SELECT USING (public.get_my_role() = 'admin' OR status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "dealers_update_admin" ON public.dealers
  FOR UPDATE USING (public.get_my_role() = 'admin' OR auth.uid() = user_id)
  WITH CHECK (public.get_my_role() = 'admin' OR auth.uid() = user_id);

-- 4. Drop and recreate RLS policies on cars table
DROP POLICY IF EXISTS "cars_admin_read_all" ON public.cars;
DROP POLICY IF EXISTS "cars_update_admin" ON public.cars;
DROP POLICY IF EXISTS "cars_delete_admin" ON public.cars;

CREATE POLICY "cars_admin_read_all" ON public.cars
  FOR SELECT USING (status = 'approved' OR public.get_my_role() = 'admin' OR auth.uid() = seller_id);

CREATE POLICY "cars_update_admin" ON public.cars
  FOR UPDATE USING (public.get_my_role() = 'admin' OR auth.uid() = seller_id)
  WITH CHECK (public.get_my_role() = 'admin' OR auth.uid() = seller_id);

CREATE POLICY "cars_delete_admin" ON public.cars
  FOR DELETE USING (public.get_my_role() = 'admin' OR auth.uid() = seller_id);

-- 5. Drop and recreate RLS policies on registration_requests table
DROP POLICY IF EXISTS "registration_requests_select_admin" ON public.registration_requests;
DROP POLICY IF EXISTS "registration_requests_update_admin" ON public.registration_requests;
DROP POLICY IF EXISTS "registration_requests_delete_admin" ON public.registration_requests;

CREATE POLICY "registration_requests_select_admin" ON public.registration_requests
  FOR SELECT USING (public.get_my_role() = 'admin');

CREATE POLICY "registration_requests_update_admin" ON public.registration_requests
  FOR UPDATE USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "registration_requests_delete_admin" ON public.registration_requests
  FOR DELETE USING (public.get_my_role() = 'admin');
