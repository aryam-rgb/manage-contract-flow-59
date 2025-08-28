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