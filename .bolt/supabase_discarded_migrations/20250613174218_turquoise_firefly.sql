/*
  # Add position field for team members and phone field for business owner

  1. Schema Changes
    - Add `position` field to `team_members` table
    - Add `owner_phone` field to `business_profiles` table
  
  2. Updates
    - Add position field for team member roles/positions
    - Add phone field for business owner contact information
*/

-- Add position field to team_members table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'position'
  ) THEN
    ALTER TABLE team_members ADD COLUMN position text;
  END IF;
END $$;

-- Add owner_phone field to business_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_profiles' AND column_name = 'owner_phone'
  ) THEN
    ALTER TABLE business_profiles ADD COLUMN owner_phone text;
  END IF;
END $$;

-- Update existing team members to have a default position if null
UPDATE team_members 
SET position = 'Team Member' 
WHERE position IS NULL;

-- Add index for position field for better query performance
CREATE INDEX IF NOT EXISTS idx_team_members_position ON team_members(position);