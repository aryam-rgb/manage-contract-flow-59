-- Create a default admin user for testing
-- Note: This is a temporary user for testing. In production, you should create users through proper channels.

-- Insert a test admin user (this will only work if the user doesn't already exist)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role
)
SELECT 
  gen_random_uuid(),
  'admin@contractflow.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"username": "admin", "full_name": "System Administrator"}'::jsonb,
  'authenticated'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@contractflow.com'
);

-- The trigger will automatically create the profile and assign user role
-- But we need to update the role to admin for this user
UPDATE user_roles 
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@contractflow.com'
);