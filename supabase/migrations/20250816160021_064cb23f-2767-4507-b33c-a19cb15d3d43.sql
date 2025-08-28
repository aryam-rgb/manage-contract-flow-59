-- Now create the sample data (continuing from the first migration)
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