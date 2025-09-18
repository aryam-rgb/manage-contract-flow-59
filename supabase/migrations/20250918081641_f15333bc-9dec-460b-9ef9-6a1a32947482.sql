-- Update the existing admin user to have admin role
UPDATE user_roles 
SET role = 'admin'
WHERE user_id = '4a7559cf-ed68-4c56-ad5c-489cbe2fec4c';

-- If no role exists for this user, insert one
INSERT INTO user_roles (user_id, role)
SELECT '4a7559cf-ed68-4c56-ad5c-489cbe2fec4c', 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = '4a7559cf-ed68-4c56-ad5c-489cbe2fec4c'
);