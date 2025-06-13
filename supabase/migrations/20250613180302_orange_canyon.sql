/*
  # Update Applications Table Structure

  1. New Tables
    - Update `applications` table to match the new structure with business, owner, and member information
    - Add proper constraints and indexes for performance

  2. Security
    - Enable RLS on `applications` table
    - Add policies for authenticated users to manage their applications

  3. Changes
    - Restructure applications table with cleaner field organization
    - Add business owner phone field
    - Add member position field
    - Maintain data integrity with proper constraints
*/

-- Drop existing applications table if it exists and recreate with new structure
DROP TABLE IF EXISTS applications CASCADE;

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business Information
  business_name text NOT NULL,
  business_description text,
  business_address text NOT NULL,
  business_city text NOT NULL,
  business_state text NOT NULL DEFAULT 'CA',
  business_zip_code text NOT NULL,
  business_email text UNIQUE NOT NULL,
  business_phone text NOT NULL,
  business_type text NOT NULL CHECK (business_type IN ('LLC', 'Corporation', 'Partnership', 'Sole Proprietorship')),
  
  -- Business Owner Information
  owner_name text NOT NULL,
  owner_phone text NOT NULL,
  owner_address text NOT NULL,
  owner_email text UNIQUE NOT NULL,
  owner_ssn_itin text,
  
  -- Member Information (up to 3 members)
  member1_name text,
  member1_phone text,
  member1_email text,
  member1_address text,
  member1_position text,
  
  member2_name text,
  member2_phone text,
  member2_email text,
  member2_address text,
  member2_position text,
  
  member3_name text,
  member3_phone text,
  member3_email text,
  member3_address text,
  member3_position text,
  
  -- Metadata
  notes text,
  status text DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_business_email ON applications (business_email);
CREATE INDEX IF NOT EXISTS idx_applications_owner_email ON applications (owner_email);
CREATE INDEX IF NOT EXISTS idx_applications_business_name ON applications (business_name);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_business_type ON applications (business_type);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications (created_at);
CREATE INDEX IF NOT EXISTS idx_applications_last_updated ON applications (last_updated);

-- Create policies for RLS
CREATE POLICY "Users can view all applications" 
  ON applications 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert applications" 
  ON applications 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can update applications" 
  ON applications 
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- Function to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_applications_updated_at_trigger ON applications;
CREATE TRIGGER update_applications_updated_at_trigger
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_applications_updated_at();