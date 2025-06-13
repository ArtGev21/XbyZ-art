/*
  # COMPLETE DATABASE WIPE - EVERYTHING DELETED
  
  ⚠️ WARNING: This will permanently delete ALL data including:
  - All custom tables and data
  - All user accounts and authentication data
  - All custom types, functions, and policies
  - All stored procedures and triggers
  
  This action is IRREVERSIBLE!
*/

-- First, disable RLS on all tables to avoid conflicts
ALTER TABLE IF EXISTS change_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS business_profiles DISABLE ROW LEVEL SECURITY;

-- Drop all policies first
DROP POLICY IF EXISTS "Users can view their own business profiles" ON business_profiles;
DROP POLICY IF EXISTS "Users can insert their own business profiles" ON business_profiles;
DROP POLICY IF EXISTS "Users can update their own business profiles" ON business_profiles;
DROP POLICY IF EXISTS "Everyone can view packages" ON packages;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own change history" ON change_history;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own team members" ON team_members;
DROP POLICY IF EXISTS "Users can insert their own team members" ON team_members;
DROP POLICY IF EXISTS "Users can update their own team members" ON team_members;
DROP POLICY IF EXISTS "Users can delete their own team members" ON team_members;

-- Drop all triggers
DROP TRIGGER IF EXISTS update_business_profiles_updated_at ON business_profiles;
DROP TRIGGER IF EXISTS update_packages_updated_at ON packages;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;

-- Drop all tables in the correct order (reverse of creation order)
DROP TABLE IF EXISTS change_history CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS business_profiles CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS team_member_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS business_type CASCADE;

-- Drop all custom functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 🔥 DELETE ALL AUTHENTICATION DATA 🔥
-- This will remove ALL user accounts and authentication data

-- Delete all user sessions
DELETE FROM auth.sessions;

-- Delete all user identities (social logins, etc.)
DELETE FROM auth.identities;

-- Delete all user accounts
DELETE FROM auth.users;

-- Delete all refresh tokens
DELETE FROM auth.refresh_tokens;

-- Clear any audit logs
DELETE FROM auth.audit_log_entries;

-- Clear any SAML providers (if any)
DELETE FROM auth.saml_providers;

-- Clear any SAML relay states (if any)
DELETE FROM auth.saml_relay_states;

-- Clear any SSO providers (if any)
DELETE FROM auth.sso_providers;

-- Clear any SSO domains (if any)
DELETE FROM auth.sso_domains;

-- Reset any sequences that might exist
DO $$
DECLARE
    seq_name TEXT;
BEGIN
    -- Reset sequences for auth tables if they exist
    FOR seq_name IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'auth'
    LOOP
        EXECUTE 'ALTER SEQUENCE auth.' || seq_name || ' RESTART WITH 1';
    END LOOP;
END $$;

-- Clear any storage buckets and objects (if using Supabase Storage)
DO $$
BEGIN
    -- Only run if storage schema exists
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        DELETE FROM storage.objects;
        DELETE FROM storage.buckets;
    END IF;
END $$;

-- Clear any realtime subscriptions
DO $$
BEGIN
    -- Only run if realtime schema exists
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'realtime') THEN
        DELETE FROM realtime.subscription;
    END IF;
END $$;

-- 🧹 VACUUM AND ANALYZE
-- Clean up the database after all deletions
VACUUM FULL;
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