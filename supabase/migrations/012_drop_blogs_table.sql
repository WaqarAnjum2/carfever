-- Migration: 012_drop_blogs_table.sql
-- Drop blogs table completely from database
DROP TABLE IF EXISTS public.blogs CASCADE;
