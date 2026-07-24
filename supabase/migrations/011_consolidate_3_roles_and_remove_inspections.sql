-- Migration: 011_consolidate_3_roles_and_remove_inspections.sql
-- Consolidate roles to ('buyer', 'seller', 'admin') and drop inspection tables & columns.

-- 1. Migrate legacy role records to 3 core roles
UPDATE public.users 
SET role = 'admin' 
WHERE role IN ('content_manager', 'inspection_manager');

UPDATE public.registration_requests 
SET role = 'seller' 
WHERE role IN ('content_manager', 'inspection_manager');

-- 2. Update CHECK constraint on public.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('buyer', 'seller', 'admin'));

-- 3. Update CHECK constraint on public.registration_requests
ALTER TABLE public.registration_requests DROP CONSTRAINT IF EXISTS registration_requests_role_check;
ALTER TABLE public.registration_requests ADD CONSTRAINT registration_requests_role_check CHECK (role IN ('buyer', 'seller'));

-- 4. Drop inspections table completely
DROP TABLE IF EXISTS public.inspections CASCADE;

-- 5. Drop inspection columns from public.cars table
ALTER TABLE public.cars DROP COLUMN IF EXISTS is_inspected;
ALTER TABLE public.cars DROP COLUMN IF EXISTS inspection_rating;
ALTER TABLE public.cars DROP COLUMN IF EXISTS inspection_notes;
ALTER TABLE public.cars DROP COLUMN IF EXISTS inspected_at;
ALTER TABLE public.cars DROP COLUMN IF EXISTS inspector_id;
ALTER TABLE public.cars DROP COLUMN IF EXISTS inspector_name;
ALTER TABLE public.cars DROP COLUMN IF EXISTS inspector_email;
ALTER TABLE public.cars DROP COLUMN IF EXISTS inspector_phone;
