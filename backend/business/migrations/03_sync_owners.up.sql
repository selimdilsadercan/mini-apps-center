-- Sync existing business owners to business_users table
INSERT INTO business.business_users (business_id, user_id, role)
SELECT id, owner_user_id, 'admin'
FROM business.businesses
ON CONFLICT (business_id, user_id) DO NOTHING;
