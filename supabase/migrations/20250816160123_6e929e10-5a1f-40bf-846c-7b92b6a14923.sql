-- Continue with user roles and profile updates
-- Assign roles to users
INSERT INTO user_roles (user_id, role) VALUES 
-- John Mwangi - Finance Department, Procurement Unit (regular user)
('11111111-1111-1111-1111-111111111111', 'user'),
-- Sarah Wanjiku - Legal Department, Legal Review Unit (reviewer)
('22222222-2222-2222-2222-222222222222', 'reviewer'),
-- Peter Kiprotich - Legal Department, Legal Approval Unit (approval)
('33333333-3333-3333-3333-333333333333', 'approval'),
-- Mary Akinyi - HR Department, Recruitment Unit (user)
('44444444-4444-4444-4444-444444444444', 'user'),
-- David Kimani - IT Department, Technology Unit (user)
('55555555-5555-5555-5555-555555555555', 'user'),
-- Grace Mutua - Legal Department, Legal Review Unit (reviewer)
('66666666-6666-6666-6666-666666666666', 'reviewer')
ON CONFLICT (user_id, role) DO NOTHING;

-- Add department and unit columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES units(id);