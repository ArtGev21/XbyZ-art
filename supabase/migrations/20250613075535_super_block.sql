/*
  # Delete All Tables - Fresh Start

  This migration will drop all existing tables and their dependencies to start fresh.
  
  1. Drop Tables
    - Drop all existing tables in the correct order to avoid foreign key conflicts
    - Drop all custom types
    - Drop all functions
    - Drop all triggers
    
  2. Clean Slate
    - Removes all business data
    - Removes all user profiles
    - Removes all team members
    - Removes all packages
    - Removes all orders
    - Removes all change history
*/

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

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Note: This will completely remove all data and structure
-- You can now create new tables with fresh migrations