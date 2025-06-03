/*
  # Initial Schema Setup

  1. New Tables
    - `business_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `business_name` (text)
      - `business_type` (enum)
      - `address_line1` (text)
      - `address_line2` (text)
      - `city` (text)
      - `state` (text)
      - `zip_code` (text)
      - `phone` (text)
      - `email` (text)
      - `tax_id` (text)
      - `description` (text)
      - `status` (enum)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `packages`
      - `id` (uuid, primary key)
      - `name` (text)
      - `business_type` (enum)
      - `price` (numeric)
      - `features` (jsonb)
      - `processing_time` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `orders`
      - `id` (uuid, primary key)
      - `business_profile_id` (uuid, references business_profiles)
      - `package_id` (uuid, references packages)
      - `status` (enum)
      - `payment_status` (enum)
      - `stripe_payment_id` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `change_history`
      - `id` (uuid, primary key)
      - `business_profile_id` (uuid, references business_profiles)
      - `field_name` (text)
      - `old_value` (text)
      - `new_value` (text)
      - `changed_by` (uuid, references auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create custom types
CREATE TYPE business_type AS ENUM ('llc', 'corporation', 'partnership', 'sole_proprietorship');
CREATE TYPE application_status AS ENUM ('draft', 'submitted', 'in_review', 'approved', 'rejected');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Create business_profiles table
CREATE TABLE business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  business_name text NOT NULL,
  business_type business_type NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL CHECK (state = 'CA'),
  zip_code text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  tax_id text,
  description text,
  status application_status DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create packages table
CREATE TABLE packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  business_type business_type NOT NULL,
  price numeric NOT NULL,
  features jsonb NOT NULL,
  processing_time text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id uuid REFERENCES business_profiles NOT NULL,
  package_id uuid REFERENCES packages NOT NULL,
  status application_status DEFAULT 'submitted',
  payment_status payment_status DEFAULT 'pending',
  stripe_payment_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create change_history table
CREATE TABLE change_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id uuid REFERENCES business_profiles NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own business profiles"
  ON business_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business profiles"
  ON business_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business profiles"
  ON business_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view packages"
  ON packages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM business_profiles
    WHERE business_profiles.id = orders.business_profile_id
    AND business_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM business_profiles
    WHERE business_profiles.id = orders.business_profile_id
    AND business_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own change history"
  ON change_history
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM business_profiles
    WHERE business_profiles.id = change_history.business_profile_id
    AND business_profiles.user_id = auth.uid()
  ));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_business_profiles_updated_at
    BEFORE UPDATE ON business_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
    BEFORE UPDATE ON packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample packages
INSERT INTO packages (name, business_type, price, features, processing_time) VALUES
('Basic LLC', 'llc', 299, '["State Filing", "Operating Agreement", "Tax ID", "Compliance Calendar"]'::jsonb, '5-7 business days'),
('Premium LLC', 'llc', 599, '["State Filing", "Operating Agreement", "Tax ID", "Compliance Calendar", "Registered Agent Service", "Banking Resolution"]'::jsonb, '3-5 business days'),
('Basic Corporation', 'corporation', 399, '["State Filing", "Bylaws", "Tax ID", "Compliance Calendar"]'::jsonb, '5-7 business days'),
('Premium Corporation', 'corporation', 799, '["State Filing", "Bylaws", "Tax ID", "Compliance Calendar", "Registered Agent Service", "Banking Resolution", "Stock Certificates"]'::jsonb, '3-5 business days'),
('Basic Partnership', 'partnership', 249, '["State Filing", "Partnership Agreement", "Tax ID"]'::jsonb, '5-7 business days'),
('Premium Partnership', 'partnership', 499, '["State Filing", "Partnership Agreement", "Tax ID", "Registered Agent Service", "Banking Resolution"]'::jsonb, '3-5 business days'),
('Sole Proprietorship', 'sole_proprietorship', 149, '["DBA Filing", "Tax ID", "Business License Research"]'::jsonb, '3-5 business days');