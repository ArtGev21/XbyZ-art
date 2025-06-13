/*
  # Safe Database Cleanup Migration

  This migration safely removes all custom tables, types, functions, policies, and triggers
  while respecting Supabase's permission system and transaction requirements.

  1. Cleanup Operations
    - Disable RLS on custom tables
    - Drop all custom policies and triggers
    - Drop all custom tables in correct order
    - Drop all custom types and functions

  2. Safety Features
    - Only modifies public schema objects we own
    - Respects transaction block limitations
    - Preserves Supabase Auth system integrity
    - Uses safe conditional checks
*/

-- First, safely disable RLS on tables that might exist
DO $$
BEGIN
    -- Disable RLS only if tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'change_history' AND table_schema = 'public') THEN
        ALTER TABLE public.change_history DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members' AND table_schema = 'public') THEN
        ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages' AND table_schema = 'public') THEN
        ALTER TABLE public.packages DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_profiles' AND table_schema = 'public') THEN
        ALTER TABLE public.business_profiles DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop all policies safely (only from public schema)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies from public schema tables only
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- Drop all triggers safely (only from public schema)
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
        AND event_object_table IN ('business_profiles', 'packages', 'orders', 'change_history', 'user_profiles', 'team_members')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 
                      trigger_record.trigger_name, 
                      trigger_record.event_object_table);
    END LOOP;
END $$;

-- Drop all custom tables in the correct order (reverse of creation order)
DROP TABLE IF EXISTS public.change_history CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.packages CASCADE;
DROP TABLE IF EXISTS public.business_profiles CASCADE;

-- Drop all custom types safely
DROP TYPE IF EXISTS public.team_member_status CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;
DROP TYPE IF EXISTS public.application_status CASCADE;
DROP TYPE IF EXISTS public.business_type CASCADE;

-- Drop all custom functions safely
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🔥 SAFE DATABASE CLEANUP SUCCESSFUL 🔥';
    RAISE NOTICE 'All custom data has been safely deleted:';
    RAISE NOTICE '✅ All custom tables and data deleted';
    RAISE NOTICE '✅ All custom types and functions deleted';
    RAISE NOTICE '✅ All custom policies and triggers deleted';
    RAISE NOTICE '✅ Database cleanup completed';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Ready for fresh table creation!';
    RAISE NOTICE '📝 Auth system remains intact and functional';
    RAISE NOTICE '⚠️  Note: User accounts are managed by Supabase Auth system';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 You can now create new tables and register new users!';
END $$;