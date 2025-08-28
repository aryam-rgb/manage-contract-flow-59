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