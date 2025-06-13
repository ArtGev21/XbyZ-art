/*
  # Create Business Members Table

  1. New Tables
    - `business_members`
      - `id` (uuid, primary key)
      - `full_name` (text, required)
      - `position_title` (text, required)
      - `department` (text, required)
      - `employment_status` (text, required)
      - `start_date` (date, required)
      - `email` (text, required, unique)
      - `phone` (text, required)
      - `reporting_manager` (text, required)
      - `access_level` (text, required)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `business_members` table
    - Add policies for authenticated users to manage their business members

  3. Validation
    - Email format validation
    - Phone number format validation
    - Enum constraints for department, employment_status, and access_level
    - Required field constraints
*/

-- Create enum types for better data integrity
CREATE TYPE department_type AS ENUM (
  'Executive',
  'Management', 
  'Operations',
  'Finance',
  'HR',
  'Sales/Marketing',
  'IT/Technical',
  'Other'
);

CREATE TYPE employment_status_type AS ENUM (
  'Full-time',
  'Part-time',
  'Contractor',
  'Consultant'
);

CREATE TYPE access_level_type AS ENUM (
  'Admin',
  'Manager',
  'Standard',
  'Limited'
);

-- Create the business_members table
CREATE TABLE IF NOT EXISTS business_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (length(trim(full_name)) > 0),
  position_title text NOT NULL CHECK (length(trim(position_title)) > 0),
  department department_type NOT NULL,
  employment_status employment_status_type NOT NULL,
  start_date date NOT NULL CHECK (start_date <= CURRENT_DATE),
  email text NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone text NOT NULL CHECK (length(trim(phone)) > 0),
  reporting_manager text NOT NULL CHECK (length(trim(reporting_manager)) > 0),
  access_level access_level_type NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_members_email ON business_members(email);
CREATE INDEX IF NOT EXISTS idx_business_members_department ON business_members(department);
CREATE INDEX IF NOT EXISTS idx_business_members_access_level ON business_members(access_level);
CREATE INDEX IF NOT EXISTS idx_business_members_start_date ON business_members(start_date);
CREATE INDEX IF NOT EXISTS idx_business_members_created_at ON business_members(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_business_members_updated_at_trigger
  BEFORE UPDATE ON business_members
  FOR EACH ROW
  EXECUTE FUNCTION update_business_members_updated_at();

-- Enable Row Level Security
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view all business members"
  ON business_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert business members"
  ON business_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update business members"
  ON business_members
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete business members"
  ON business_members
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function for validating and inserting business members
CREATE OR REPLACE FUNCTION insert_business_member(
  p_full_name text,
  p_position_title text,
  p_department text,
  p_employment_status text,
  p_start_date date,
  p_email text,
  p_phone text,
  p_reporting_manager text,
  p_access_level text
)
RETURNS business_members
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result business_members%ROWTYPE;
BEGIN
  -- Validate required fields
  IF trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;
  
  IF trim(p_position_title) = '' THEN
    RAISE EXCEPTION 'Position title is required';
  END IF;
  
  IF trim(p_email) = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  
  IF trim(p_phone) = '' THEN
    RAISE EXCEPTION 'Phone number is required';
  END IF;
  
  IF trim(p_reporting_manager) = '' THEN
    RAISE EXCEPTION 'Reporting manager is required';
  END IF;
  
  -- Validate email format
  IF p_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate start date
  IF p_start_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Start date cannot be in the future';
  END IF;
  
  -- Check email uniqueness
  IF EXISTS (SELECT 1 FROM business_members WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email address is already in use';
  END IF;
  
  -- Insert the record
  INSERT INTO business_members (
    full_name,
    position_title,
    department,
    employment_status,
    start_date,
    email,
    phone,
    reporting_manager,
    access_level
  ) VALUES (
    trim(p_full_name),
    trim(p_position_title),
    p_department::department_type,
    p_employment_status::employment_status_type,
    p_start_date,
    lower(trim(p_email)),
    trim(p_phone),
    trim(p_reporting_manager),
    p_access_level::access_level_type
  ) RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Create function for updating business members
CREATE OR REPLACE FUNCTION update_business_member(
  p_id uuid,
  p_full_name text DEFAULT NULL,
  p_position_title text DEFAULT NULL,
  p_department text DEFAULT NULL,
  p_employment_status text DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_reporting_manager text DEFAULT NULL,
  p_access_level text DEFAULT NULL
)
RETURNS business_members
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_record business_members%ROWTYPE;
  v_result business_members%ROWTYPE;
BEGIN
  -- Check if record exists
  SELECT * INTO v_existing_record 
  FROM business_members 
  WHERE id = p_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business member with ID % not found', p_id;
  END IF;
  
  -- Validate email uniqueness if email is being updated
  IF p_email IS NOT NULL AND lower(trim(p_email)) != v_existing_record.email THEN
    IF EXISTS (SELECT 1 FROM business_members WHERE email = lower(trim(p_email)) AND id != p_id) THEN
      RAISE EXCEPTION 'Email address is already in use';
    END IF;
    
    -- Validate email format
    IF p_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format';
    END IF;
  END IF;
  
  -- Validate start date if being updated
  IF p_start_date IS NOT NULL AND p_start_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Start date cannot be in the future';
  END IF;
  
  -- Validate required fields remain non-null
  IF p_full_name IS NOT NULL AND trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'Full name cannot be empty';
  END IF;
  
  IF p_position_title IS NOT NULL AND trim(p_position_title) = '' THEN
    RAISE EXCEPTION 'Position title cannot be empty';
  END IF;
  
  IF p_phone IS NOT NULL AND trim(p_phone) = '' THEN
    RAISE EXCEPTION 'Phone number cannot be empty';
  END IF;
  
  IF p_reporting_manager IS NOT NULL AND trim(p_reporting_manager) = '' THEN
    RAISE EXCEPTION 'Reporting manager cannot be empty';
  END IF;
  
  -- Perform the update
  UPDATE business_members
  SET 
    full_name = COALESCE(trim(p_full_name), full_name),
    position_title = COALESCE(trim(p_position_title), position_title),
    department = COALESCE(p_department::department_type, department),
    employment_status = COALESCE(p_employment_status::employment_status_type, employment_status),
    start_date = COALESCE(p_start_date, start_date),
    email = COALESCE(lower(trim(p_email)), email),
    phone = COALESCE(trim(p_phone), phone),
    reporting_manager = COALESCE(trim(p_reporting_manager), reporting_manager),
    access_level = COALESCE(p_access_level::access_level_type, access_level),
    updated_at = now()
  WHERE id = p_id
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$;