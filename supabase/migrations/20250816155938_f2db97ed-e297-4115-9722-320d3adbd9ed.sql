-- Update app_role enum to include reviewer and approval roles
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'reviewer';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'approval';

-- Create some sample departments and units
INSERT INTO departments (name, description) VALUES 
('Legal Department', 'Legal review and compliance'),
('Finance Department', 'Financial management and procurement'),
('HR Department', 'Human resources and administration'),
('IT Department', 'Information technology and systems')
ON CONFLICT DO NOTHING;

-- Create sample units within departments
INSERT INTO units (name, description, department_id) 
SELECT 'Legal Review Unit', 'Contract review and legal compliance', d.id 
FROM departments d WHERE d.name = 'Legal Department'
ON CONFLICT DO NOTHING;

INSERT INTO units (name, description, department_id) 
SELECT 'Legal Approval Unit', 'Final legal approval and signing', d.id 
FROM departments d WHERE d.name = 'Legal Department'
ON CONFLICT DO NOTHING;

INSERT INTO units (name, description, department_id) 
SELECT 'Procurement Unit', 'Vendor contracts and procurement', d.id 
FROM departments d WHERE d.name = 'Finance Department'
ON CONFLICT DO NOTHING;

INSERT INTO units (name, description, department_id) 
SELECT 'Budget Unit', 'Budget planning and contract financing', d.id 
FROM departments d WHERE d.name = 'Finance Department'
ON CONFLICT DO NOTHING;

INSERT INTO units (name, description, department_id) 
SELECT 'Recruitment Unit', 'Employment contracts and hiring', d.id 
FROM departments d WHERE d.name = 'HR Department'
ON CONFLICT DO NOTHING;

INSERT INTO units (name, description, department_id) 
SELECT 'Technology Unit', 'Software licenses and IT contracts', d.id 
FROM departments d WHERE d.name = 'IT Department'
ON CONFLICT DO NOTHING;

-- Create sample users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
VALUES 
('11111111-1111-1111-1111-111111111111', 'john.mwangi@kcbbank.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"full_name": "John Mwangi", "username": "john.mwangi"}'),
('22222222-2222-2222-2222-222222222222', 'sarah.wanjiku@kcbbank.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"full_name": "Sarah Wanjiku", "username": "sarah.wanjiku"}'),
('33333333-3333-3333-3333-333333333333', 'peter.kiprotich@kcbbank.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"full_name": "Peter Kiprotich", "username": "peter.kiprotich"}'),
('44444444-4444-4444-4444-444444444444', 'mary.akinyi@kcbbank.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"full_name": "Mary Akinyi", "username": "mary.akinyi"}'),
('55555555-5555-5555-5555-555555555555', 'david.kimani@kcbbank.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"full_name": "David Kimani", "username": "david.kimani"}'),
('66666666-6666-6666-6666-666666666666', 'grace.mutua@kcbbank.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"full_name": "Grace Mutua", "username": "grace.mutua"}')
ON CONFLICT (id) DO NOTHING;

-- Create corresponding profiles
INSERT INTO profiles (id, username, full_name)
VALUES 
('11111111-1111-1111-1111-111111111111', 'john.mwangi', 'John Mwangi'),
('22222222-2222-2222-2222-222222222222', 'sarah.wanjiku', 'Sarah Wanjiku'),
('33333333-3333-3333-3333-333333333333', 'peter.kiprotich', 'Peter Kiprotich'),
('44444444-4444-4444-4444-444444444444', 'mary.akinyi', 'Mary Akinyi'),
('55555555-5555-5555-5555-555555555555', 'david.kimani', 'David Kimani'),
('66666666-6666-6666-6666-666666666666', 'grace.mutua', 'Grace Mutua')
ON CONFLICT (id) DO NOTHING;

-- Assign roles to users
INSERT INTO user_roles (user_id, role) VALUES 
-- Admin user (already exists)
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

-- Update profiles with department associations (we'll need to add department_id to profiles)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES units(id);

-- Update profiles with department and unit assignments
UPDATE profiles SET 
  department_id = (SELECT id FROM departments WHERE name = 'Finance Department'),
  unit_id = (SELECT id FROM units WHERE name = 'Procurement Unit')
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE profiles SET 
  department_id = (SELECT id FROM departments WHERE name = 'Legal Department'),
  unit_id = (SELECT id FROM units WHERE name = 'Legal Review Unit')
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE profiles SET 
  department_id = (SELECT id FROM departments WHERE name = 'Legal Department'),
  unit_id = (SELECT id FROM units WHERE name = 'Legal Approval Unit')
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE profiles SET 
  department_id = (SELECT id FROM departments WHERE name = 'HR Department'),
  unit_id = (SELECT id FROM units WHERE name = 'Recruitment Unit')
WHERE id = '44444444-4444-4444-4444-444444444444';

UPDATE profiles SET 
  department_id = (SELECT id FROM departments WHERE name = 'IT Department'),
  unit_id = (SELECT id FROM units WHERE name = 'Technology Unit')
WHERE id = '55555555-5555-5555-5555-555555555555';

UPDATE profiles SET 
  department_id = (SELECT id FROM departments WHERE name = 'Legal Department'),
  unit_id = (SELECT id FROM units WHERE name = 'Legal Review Unit')
WHERE id = '66666666-6666-6666-6666-666666666666';

-- Create sample contracts
INSERT INTO contracts (id, title, description, contract_type, status, priority, value, start_date, end_date, created_by, assigned_to, department_id, unit_id) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Software License Agreement - Microsoft Office', 'Annual licensing agreement for Microsoft Office Suite across all branches', 'software', 'pending_review', 'high', 50000000, '2024-01-01', '2024-12-31', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', (SELECT id FROM departments WHERE name = 'IT Department'), (SELECT id FROM units WHERE name = 'Technology Unit')),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Employment Contract - Branch Manager', 'Employment contract for new branch manager position in Nairobi', 'employment', 'under_review', 'medium', 2400000, '2024-02-01', '2025-02-01', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', (SELECT id FROM departments WHERE name = 'HR Department'), (SELECT id FROM units WHERE name = 'Recruitment Unit')),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Vendor Agreement - Office Supplies', 'Annual contract for office supplies and stationery for all branches', 'vendor', 'approved', 'low', 1500000, '2024-01-01', '2024-12-31', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', (SELECT id FROM departments WHERE name = 'Finance Department'), (SELECT id FROM units WHERE name = 'Procurement Unit'))
ON CONFLICT (id) DO NOTHING;