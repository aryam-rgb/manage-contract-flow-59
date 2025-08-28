-- Delete the incorrectly created admin user
DELETE FROM auth.users WHERE email = 'admin@contractflow.com';

-- Note: We'll create the admin user through the application's admin interface
-- For now, let's create a temporary simple user to bootstrap the system

-- The proper way is to use Supabase's auth.admin.createUser() function
-- which we'll implement in the next step