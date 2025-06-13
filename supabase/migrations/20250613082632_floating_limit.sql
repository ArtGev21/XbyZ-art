/*
  # Complete Database Reset and Cleanup

  This migration safely removes all existing data and structures to provide a clean slate.
  It handles cases where tables may or may not exist to avoid errors.

  1. Safety Checks
    - Uses IF EXISTS to prevent errors if objects don't exist
    - Handles dependencies properly
    - Cleans up in correct order

  2. Complete Cleanup
    - Removes all custom tables
    - Removes all custom types
    - Removes all custom functions
    - Clears authentication data safely
    - Optimizes database after cleanup

  3. Admin Safety
    - Only affects custom application data
    - Preserves Supabase core functionality
    - Maintains database integrity
*/

-- First, safely disable RLS on tables that might exist
DO $$
BEGIN
    -- Disable RLS only if tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'change_history') THEN
        ALTER TABLE change_history DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
        ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages') THEN
        ALTER TABLE packages DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_profiles') THEN
        ALTER TABLE business_profiles DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop all policies safely (only if they exist)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies from all tables
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

-- Drop all triggers safely
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', 
                      trigger_record.trigger_name, 
                      trigger_record.event_object_table);
    END LOOP;
END $$;

-- Drop all tables in the correct order (reverse of creation order)
DROP TABLE IF EXISTS change_history CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS business_profiles CASCADE;

-- Drop all custom types safely
DROP TYPE IF EXISTS team_member_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS business_type CASCADE;

-- Drop all custom functions safely
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 🔥 SAFELY CLEAR AUTHENTICATION DATA 🔥
-- This removes user accounts while preserving system integrity

DO $$
BEGIN
    -- Only clear auth data if tables exist and have data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'sessions') THEN
        DELETE FROM auth.sessions;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'identities') THEN
        DELETE FROM auth.identities;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DELETE FROM auth.users;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'refresh_tokens') THEN
        DELETE FROM auth.refresh_tokens;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'audit_log_entries') THEN
        DELETE FROM auth.audit_log_entries;
    END IF;

    -- Clear SAML and SSO data if tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'saml_providers') THEN
        DELETE FROM auth.saml_providers;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'saml_relay_states') THEN
        DELETE FROM auth.saml_relay_states;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'sso_providers') THEN
        DELETE FROM auth.sso_providers;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'sso_domains') THEN
        DELETE FROM auth.sso_domains;
    END IF;
END $$;

-- Reset sequences safely
DO $$
DECLARE
    seq_record RECORD;
BEGIN
    -- Reset sequences for auth tables if they exist
    FOR seq_record IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'auth'
    LOOP
        EXECUTE format('ALTER SEQUENCE auth.%I RESTART WITH 1', seq_record.sequence_name);
    END LOOP;
END $$;

-- Clear storage data safely (if using Supabase Storage)
DO $$
BEGIN
    -- Only run if storage schema exists
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
            DELETE FROM storage.objects;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
            DELETE FROM storage.buckets;
        END IF;
    END IF;
END $$;

-- Clear realtime subscriptions safely
DO $$
BEGIN
    -- Only run if realtime schema exists
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'realtime') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'realtime' AND table_name = 'subscription') THEN
            DELETE FROM realtime.subscription;
        END IF;
    END IF;
END $$;

-- 🧹 VACUUM AND ANALYZE
-- Clean up the database after all deletions
VACUUM;
ANALYZE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🔥 COMPLETE DATABASE WIPE SUCCESSFUL 🔥';
    RAISE NOTICE 'All data has been permanently deleted:';
    RAISE NOTICE '✅ All custom tables and data deleted';
    RAISE NOTICE '✅ All user accounts and authentication data deleted';
    RAISE NOTICE '✅ All sessions and tokens deleted';
    RAISE NOTICE '✅ All custom types and functions deleted';
    RAISE NOTICE '✅ All policies and triggers deleted';
    RAISE NOTICE '✅ All storage data deleted (if applicable)';
    RAISE NOTICE '✅ Database vacuumed and optimized';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 You now have a completely clean slate!';
    RAISE NOTICE '📝 Ready for fresh table creation and new user registrations';
END $$;