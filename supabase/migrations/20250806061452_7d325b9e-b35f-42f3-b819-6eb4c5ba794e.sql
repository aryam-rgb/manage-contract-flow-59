-- Update the existing admin user to set email_confirmed_at
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'admin@contractflow.com';