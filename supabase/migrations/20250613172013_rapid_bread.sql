/*
  # Comprehensive UPDATE Statements for Business Applications
  
  This file contains SQL UPDATE statements for editing business application data
  with proper validation, constraints, and automatic timestamp updates.
*/

-- =====================================================
-- 1. UPDATE for Current business_profiles Table Schema
-- =====================================================

-- Function to update business profiles with validation
CREATE OR REPLACE FUNCTION update_business_profile(
    p_id uuid,
    p_business_name text DEFAULT NULL,
    p_business_type text DEFAULT NULL,
    p_address_line1 text DEFAULT NULL,
    p_address_line2 text DEFAULT NULL,
    p_city text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_zip_code text DEFAULT NULL,
    p_phone text DEFAULT NULL,
    p_email text DEFAULT NULL,
    p_tax_id text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_status text DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    user_id uuid,
    business_name text,
    business_type text,
    address_line1 text,
    address_line2 text,
    city text,
    state text,
    zip_code text,
    phone text,
    email text,
    tax_id text,
    description text,
    status text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_record RECORD;
    v_email_exists boolean := false;
BEGIN
    -- Check if record exists
    SELECT * INTO v_existing_record 
    FROM business_profiles bp 
    WHERE bp.id = p_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Business profile with ID % not found', p_id;
    END IF;
    
    -- Validate email uniqueness if email is being updated
    IF p_email IS NOT NULL AND p_email != v_existing_record.email THEN
        SELECT EXISTS(
            SELECT 1 FROM business_profiles 
            WHERE email = p_email AND id != p_id
        ) INTO v_email_exists;
        
        IF v_email_exists THEN
            RAISE EXCEPTION 'Email address % is already in use', p_email;
        END IF;
    END IF;
    
    -- Validate required fields
    IF COALESCE(p_business_name, v_existing_record.business_name) IS NULL THEN
        RAISE EXCEPTION 'Business name cannot be null';
    END IF;
    
    IF COALESCE(p_email, v_existing_record.email) IS NULL THEN
        RAISE EXCEPTION 'Business email cannot be null';
    END IF;
    
    IF COALESCE(p_address_line1, v_existing_record.address_line1) IS NULL THEN
        RAISE EXCEPTION 'Address line 1 cannot be null';
    END IF;
    
    IF COALESCE(p_city, v_existing_record.city) IS NULL THEN
        RAISE EXCEPTION 'City cannot be null';
    END IF;
    
    IF COALESCE(p_state, v_existing_record.state) IS NULL THEN
        RAISE EXCEPTION 'State cannot be null';
    END IF;
    
    IF COALESCE(p_zip_code, v_existing_record.zip_code) IS NULL THEN
        RAISE EXCEPTION 'ZIP code cannot be null';
    END IF;
    
    -- Validate business type enum
    IF p_business_type IS NOT NULL AND p_business_type NOT IN ('llc', 'corporation', 'partnership', 'sole_proprietorship') THEN
        RAISE EXCEPTION 'Invalid business type: %', p_business_type;
    END IF;
    
    -- Validate status enum
    IF p_status IS NOT NULL AND p_status NOT IN ('draft', 'submitted', 'in_review', 'approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status: %', p_status;
    END IF;
    
    -- Perform the update
    RETURN QUERY
    UPDATE business_profiles
    SET 
        business_name = COALESCE(p_business_name, business_profiles.business_name),
        business_type = COALESCE(p_business_type::business_type, business_profiles.business_type),
        address_line1 = COALESCE(p_address_line1, business_profiles.address_line1),
        address_line2 = COALESCE(p_address_line2, business_profiles.address_line2),
        city = COALESCE(p_city, business_profiles.city),
        state = COALESCE(p_state, business_profiles.state),
        zip_code = COALESCE(p_zip_code, business_profiles.zip_code),
        phone = COALESCE(p_phone, business_profiles.phone),
        email = COALESCE(p_email, business_profiles.email),
        tax_id = COALESCE(p_tax_id, business_profiles.tax_id),
        description = COALESCE(p_description, business_profiles.description),
        status = COALESCE(p_status::application_status, business_profiles.status),
        updated_at = NOW()
    WHERE business_profiles.id = p_id
    RETURNING 
        business_profiles.id,
        business_profiles.user_id,
        business_profiles.business_name,
        business_profiles.business_type::text,
        business_profiles.address_line1,
        business_profiles.address_line2,
        business_profiles.city,
        business_profiles.state,
        business_profiles.zip_code,
        business_profiles.phone,
        business_profiles.email,
        business_profiles.tax_id,
        business_profiles.description,
        business_profiles.status::text,
        business_profiles.created_at,
        business_profiles.updated_at;
END;
$$;

-- Simple UPDATE statement for business_profiles (alternative approach)
/*
UPDATE business_profiles
SET 
    business_name = COALESCE($1, business_name),
    business_type = COALESCE($2::business_type, business_type),
    address_line1 = COALESCE($3, address_line1),
    address_line2 = COALESCE($4, address_line2),
    city = COALESCE($5, city),
    state = COALESCE($6, state),
    zip_code = COALESCE($7, zip_code),
    phone = COALESCE($8, phone),
    email = COALESCE($9, email),
    tax_id = COALESCE($10, tax_id),
    description = COALESCE($11, description),
    status = COALESCE($12::application_status, status),
    updated_at = NOW()
WHERE id = $13
  AND business_name IS NOT NULL  -- Ensure required fields remain non-null
  AND email IS NOT NULL
  AND address_line1 IS NOT NULL
  AND city IS NOT NULL
  AND state IS NOT NULL
  AND zip_code IS NOT NULL
  AND NOT EXISTS (  -- Ensure email uniqueness
      SELECT 1 FROM business_profiles 
      WHERE email = COALESCE($9, business_profiles.email) 
      AND id != $13
  )
RETURNING *;
*/

-- =====================================================
-- 2. Complete Applications Table Schema (as per your example)
-- =====================================================

-- Create the comprehensive applications table
CREATE TABLE IF NOT EXISTS applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Business Information
    business_name text NOT NULL,
    business_type text NOT NULL,
    business_address text NOT NULL,
    business_phone text NOT NULL,
    business_email text NOT NULL UNIQUE,
    business_website text,
    business_registration_number text,
    business_tax_id text,
    
    -- Primary Contact/Owner
    primary_first_name text NOT NULL,
    primary_last_name text NOT NULL,
    primary_email text NOT NULL UNIQUE,
    primary_phone text NOT NULL,
    primary_address text NOT NULL,
    primary_dob date,
    primary_ssn text,
    primary_id_type text,
    primary_id_number text,
    
    -- Member 1
    member1_first_name text,
    member1_last_name text,
    member1_email text,
    member1_phone text,
    member1_address text,
    member1_dob date,
    member1_ssn text,
    member1_id_type text,
    member1_id_number text,
    
    -- Member 2
    member2_first_name text,
    member2_last_name text,
    member2_email text,
    member2_phone text,
    member2_address text,
    member2_dob date,
    member2_ssn text,
    member2_id_type text,
    member2_id_number text,
    
    -- Member 3
    member3_first_name text,
    member3_last_name text,
    member3_email text,
    member3_phone text,
    member3_address text,
    member3_dob date,
    member3_ssn text,
    member3_id_type text,
    member3_id_number text,
    
    -- Additional Information
    notes text,
    
    -- Timestamps
    created_at timestamptz DEFAULT NOW() NOT NULL,
    last_updated timestamptz DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_business_email ON applications(business_email);
CREATE INDEX IF NOT EXISTS idx_applications_primary_email ON applications(primary_email);
CREATE INDEX IF NOT EXISTS idx_applications_business_name ON applications(business_name);
CREATE INDEX IF NOT EXISTS idx_applications_last_updated ON applications(last_updated);

-- Function to update applications with comprehensive validation
CREATE OR REPLACE FUNCTION update_application(
    p_id uuid,
    p_business_name text DEFAULT NULL,
    p_business_type text DEFAULT NULL,
    p_business_address text DEFAULT NULL,
    p_business_phone text DEFAULT NULL,
    p_business_email text DEFAULT NULL,
    p_business_website text DEFAULT NULL,
    p_business_registration_number text DEFAULT NULL,
    p_business_tax_id text DEFAULT NULL,
    p_primary_first_name text DEFAULT NULL,
    p_primary_last_name text DEFAULT NULL,
    p_primary_email text DEFAULT NULL,
    p_primary_phone text DEFAULT NULL,
    p_primary_address text DEFAULT NULL,
    p_primary_dob date DEFAULT NULL,
    p_primary_ssn text DEFAULT NULL,
    p_primary_id_type text DEFAULT NULL,
    p_primary_id_number text DEFAULT NULL,
    p_member1_first_name text DEFAULT NULL,
    p_member1_last_name text DEFAULT NULL,
    p_member1_email text DEFAULT NULL,
    p_member1_phone text DEFAULT NULL,
    p_member1_address text DEFAULT NULL,
    p_member1_dob date DEFAULT NULL,
    p_member1_ssn text DEFAULT NULL,
    p_member1_id_type text DEFAULT NULL,
    p_member1_id_number text DEFAULT NULL,
    p_member2_first_name text DEFAULT NULL,
    p_member2_last_name text DEFAULT NULL,
    p_member2_email text DEFAULT NULL,
    p_member2_phone text DEFAULT NULL,
    p_member2_address text DEFAULT NULL,
    p_member2_dob date DEFAULT NULL,
    p_member2_ssn text DEFAULT NULL,
    p_member2_id_type text DEFAULT NULL,
    p_member2_id_number text DEFAULT NULL,
    p_member3_first_name text DEFAULT NULL,
    p_member3_last_name text DEFAULT NULL,
    p_member3_email text DEFAULT NULL,
    p_member3_phone text DEFAULT NULL,
    p_member3_address text DEFAULT NULL,
    p_member3_dob date DEFAULT NULL,
    p_member3_ssn text DEFAULT NULL,
    p_member3_id_type text DEFAULT NULL,
    p_member3_id_number text DEFAULT NULL,
    p_notes text DEFAULT NULL
)
RETURNS applications
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_record applications%ROWTYPE;
    v_business_email_exists boolean := false;
    v_primary_email_exists boolean := false;
    v_result applications%ROWTYPE;
BEGIN
    -- Check if record exists
    SELECT * INTO v_existing_record 
    FROM applications 
    WHERE id = p_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application with ID % not found', p_id;
    END IF;
    
    -- Validate business email uniqueness
    IF p_business_email IS NOT NULL AND p_business_email != v_existing_record.business_email THEN
        SELECT EXISTS(
            SELECT 1 FROM applications 
            WHERE business_email = p_business_email AND id != p_id
        ) INTO v_business_email_exists;
        
        IF v_business_email_exists THEN
            RAISE EXCEPTION 'Business email % is already in use', p_business_email;
        END IF;
    END IF;
    
    -- Validate primary email uniqueness
    IF p_primary_email IS NOT NULL AND p_primary_email != v_existing_record.primary_email THEN
        SELECT EXISTS(
            SELECT 1 FROM applications 
            WHERE primary_email = p_primary_email AND id != p_id
        ) INTO v_primary_email_exists;
        
        IF v_primary_email_exists THEN
            RAISE EXCEPTION 'Primary email % is already in use', p_primary_email;
        END IF;
    END IF;
    
    -- Validate required fields remain non-null
    IF COALESCE(p_business_name, v_existing_record.business_name) IS NULL THEN
        RAISE EXCEPTION 'Business name cannot be null';
    END IF;
    
    IF COALESCE(p_business_type, v_existing_record.business_type) IS NULL THEN
        RAISE EXCEPTION 'Business type cannot be null';
    END IF;
    
    IF COALESCE(p_business_address, v_existing_record.business_address) IS NULL THEN
        RAISE EXCEPTION 'Business address cannot be null';
    END IF;
    
    IF COALESCE(p_business_phone, v_existing_record.business_phone) IS NULL THEN
        RAISE EXCEPTION 'Business phone cannot be null';
    END IF;
    
    IF COALESCE(p_business_email, v_existing_record.business_email) IS NULL THEN
        RAISE EXCEPTION 'Business email cannot be null';
    END IF;
    
    IF COALESCE(p_primary_first_name, v_existing_record.primary_first_name) IS NULL THEN
        RAISE EXCEPTION 'Primary first name cannot be null';
    END IF;
    
    IF COALESCE(p_primary_last_name, v_existing_record.primary_last_name) IS NULL THEN
        RAISE EXCEPTION 'Primary last name cannot be null';
    END IF;
    
    IF COALESCE(p_primary_email, v_existing_record.primary_email) IS NULL THEN
        RAISE EXCEPTION 'Primary email cannot be null';
    END IF;
    
    IF COALESCE(p_primary_phone, v_existing_record.primary_phone) IS NULL THEN
        RAISE EXCEPTION 'Primary phone cannot be null';
    END IF;
    
    IF COALESCE(p_primary_address, v_existing_record.primary_address) IS NULL THEN
        RAISE EXCEPTION 'Primary address cannot be null';
    END IF;
    
    -- Validate email formats
    IF p_business_email IS NOT NULL AND p_business_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid business email format: %', p_business_email;
    END IF;
    
    IF p_primary_email IS NOT NULL AND p_primary_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid primary email format: %', p_primary_email;
    END IF;
    
    -- Perform the update
    UPDATE applications
    SET 
        business_name = COALESCE(p_business_name, business_name),
        business_type = COALESCE(p_business_type, business_type),
        business_address = COALESCE(p_business_address, business_address),
        business_phone = COALESCE(p_business_phone, business_phone),
        business_email = COALESCE(p_business_email, business_email),
        business_website = COALESCE(p_business_website, business_website),
        business_registration_number = COALESCE(p_business_registration_number, business_registration_number),
        business_tax_id = COALESCE(p_business_tax_id, business_tax_id),
        primary_first_name = COALESCE(p_primary_first_name, primary_first_name),
        primary_last_name = COALESCE(p_primary_last_name, primary_last_name),
        primary_email = COALESCE(p_primary_email, primary_email),
        primary_phone = COALESCE(p_primary_phone, primary_phone),
        primary_address = COALESCE(p_primary_address, primary_address),
        primary_dob = COALESCE(p_primary_dob, primary_dob),
        primary_ssn = COALESCE(p_primary_ssn, primary_ssn),
        primary_id_type = COALESCE(p_primary_id_type, primary_id_type),
        primary_id_number = COALESCE(p_primary_id_number, primary_id_number),
        member1_first_name = COALESCE(p_member1_first_name, member1_first_name),
        member1_last_name = COALESCE(p_member1_last_name, member1_last_name),
        member1_email = COALESCE(p_member1_email, member1_email),
        member1_phone = COALESCE(p_member1_phone, member1_phone),
        member1_address = COALESCE(p_member1_address, member1_address),
        member1_dob = COALESCE(p_member1_dob, member1_dob),
        member1_ssn = COALESCE(p_member1_ssn, member1_ssn),
        member1_id_type = COALESCE(p_member1_id_type, member1_id_type),
        member1_id_number = COALESCE(p_member1_id_number, member1_id_number),
        member2_first_name = COALESCE(p_member2_first_name, member2_first_name),
        member2_last_name = COALESCE(p_member2_last_name, member2_last_name),
        member2_email = COALESCE(p_member2_email, member2_email),
        member2_phone = COALESCE(p_member2_phone, member2_phone),
        member2_address = COALESCE(p_member2_address, member2_address),
        member2_dob = COALESCE(p_member2_dob, member2_dob),
        member2_ssn = COALESCE(p_member2_ssn, member2_ssn),
        member2_id_type = COALESCE(p_member2_id_type, member2_id_type),
        member2_id_number = COALESCE(p_member2_id_number, member2_id_number),
        member3_first_name = COALESCE(p_member3_first_name, member3_first_name),
        member3_last_name = COALESCE(p_member3_last_name, member3_last_name),
        member3_email = COALESCE(p_member3_email, member3_email),
        member3_phone = COALESCE(p_member3_phone, member3_phone),
        member3_address = COALESCE(p_member3_address, member3_address),
        member3_dob = COALESCE(p_member3_dob, member3_dob),
        member3_ssn = COALESCE(p_member3_ssn, member3_ssn),
        member3_id_type = COALESCE(p_member3_id_type, member3_id_type),
        member3_id_number = COALESCE(p_member3_id_number, member3_id_number),
        notes = COALESCE(p_notes, notes),
        last_updated = NOW()
    WHERE id = p_id
    RETURNING * INTO v_result;
    
    RETURN v_result;
END;
$$;

-- =====================================================
-- 3. Direct UPDATE Statement (as per your example)
-- =====================================================

/*
-- This is the exact UPDATE statement from your example with added validation
UPDATE applications
SET 
    business_name = COALESCE($1, business_name),
    business_type = COALESCE($2, business_type),
    business_address = COALESCE($3, business_address),
    business_phone = COALESCE($4, business_phone),
    business_email = COALESCE($5, business_email),
    business_website = COALESCE($6, business_website),
    business_registration_number = COALESCE($7, business_registration_number),
    business_tax_id = COALESCE($8, business_tax_id),
    primary_first_name = COALESCE($9, primary_first_name),
    primary_last_name = COALESCE($10, primary_last_name),
    primary_email = COALESCE($11, primary_email),
    primary_phone = COALESCE($12, primary_phone),
    primary_address = COALESCE($13, primary_address),
    primary_dob = COALESCE($14, primary_dob),
    primary_ssn = COALESCE($15, primary_ssn),
    primary_id_type = COALESCE($16, primary_id_type),
    primary_id_number = COALESCE($17, primary_id_number),
    member1_first_name = COALESCE($18, member1_first_name),
    member1_last_name = COALESCE($19, member1_last_name),
    member1_email = COALESCE($20, member1_email),
    member1_phone = COALESCE($21, member1_phone),
    member1_address = COALESCE($22, member1_address),
    member1_dob = COALESCE($23, member1_dob),
    member1_ssn = COALESCE($24, member1_ssn),
    member1_id_type = COALESCE($25, member1_id_type),
    member1_id_number = COALESCE($26, member1_id_number),
    member2_first_name = COALESCE($27, member2_first_name),
    member2_last_name = COALESCE($28, member2_last_name),
    member2_email = COALESCE($29, member2_email),
    member2_phone = COALESCE($30, member2_phone),
    member2_address = COALESCE($31, member2_address),
    member2_dob = COALESCE($32, member2_dob),
    member2_ssn = COALESCE($33, member2_ssn),
    member2_id_type = COALESCE($34, member2_id_type),
    member2_id_number = COALESCE($35, member2_id_number),
    member3_first_name = COALESCE($36, member3_first_name),
    member3_last_name = COALESCE($37, member3_last_name),
    member3_email = COALESCE($38, member3_email),
    member3_phone = COALESCE($39, member3_phone),
    member3_address = COALESCE($40, member3_address),
    member3_dob = COALESCE($41, member3_dob),
    member3_ssn = COALESCE($42, member3_ssn),
    member3_id_type = COALESCE($43, member3_id_type),
    member3_id_number = COALESCE($44, member3_id_number),
    notes = COALESCE($45, notes),
    last_updated = NOW()
WHERE id = $46
  -- Validation constraints
  AND COALESCE($1, business_name) IS NOT NULL  -- business_name required
  AND COALESCE($2, business_type) IS NOT NULL  -- business_type required
  AND COALESCE($3, business_address) IS NOT NULL  -- business_address required
  AND COALESCE($4, business_phone) IS NOT NULL  -- business_phone required
  AND COALESCE($5, business_email) IS NOT NULL  -- business_email required
  AND COALESCE($9, primary_first_name) IS NOT NULL  -- primary_first_name required
  AND COALESCE($10, primary_last_name) IS NOT NULL  -- primary_last_name required
  AND COALESCE($11, primary_email) IS NOT NULL  -- primary_email required
  AND COALESCE($12, primary_phone) IS NOT NULL  -- primary_phone required
  AND COALESCE($13, primary_address) IS NOT NULL  -- primary_address required
  -- Email uniqueness validation
  AND NOT EXISTS (
      SELECT 1 FROM applications 
      WHERE business_email = COALESCE($5, applications.business_email) 
      AND id != $46
  )
  AND NOT EXISTS (
      SELECT 1 FROM applications 
      WHERE primary_email = COALESCE($11, applications.primary_email) 
      AND id != $46
  )
RETURNING *;
*/

-- =====================================================
-- 4. Usage Examples
-- =====================================================

/*
-- Example 1: Update business profile using function
SELECT * FROM update_business_profile(
    p_id := 'your-uuid-here',
    p_business_name := 'Updated Business Name',
    p_email := 'newemail@example.com',
    p_phone := '555-123-4567'
);

-- Example 2: Update application using function
SELECT * FROM update_application(
    p_id := 'your-uuid-here',
    p_business_name := 'Updated Business Name',
    p_business_email := 'newemail@business.com',
    p_primary_email := 'newemail@personal.com',
    p_notes := 'Updated notes'
);

-- Example 3: Partial update with validation
UPDATE business_profiles
SET 
    business_name = COALESCE('New Name', business_name),
    email = COALESCE('new@email.com', email),
    updated_at = NOW()
WHERE id = 'your-uuid-here'
  AND 'New Name' IS NOT NULL
  AND 'new@email.com' IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM business_profiles 
      WHERE email = 'new@email.com' 
      AND id != 'your-uuid-here'
  )
RETURNING *;
*/