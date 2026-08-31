-- =====================================================
-- Optional demo seed data (NON-admin accounts only).
--
-- The ADMIN account is intentionally NOT created here with a
-- plaintext password. Passwords must be bcrypt-hashed, so the
-- admin account is created by running:
--
--     python backend/seed_admin.py
--
-- which reads SEED_ADMIN_* from backend/.env, hashes the
-- password with bcrypt, and inserts it safely.
-- =====================================================

USE teampulse_db;

-- Example demo users for manual testing during development.
-- Replace/remove before any real deployment.
-- Password for all of these below is: Demo@12345
-- (hash generated with bcrypt, cost factor 12 — see backend/seed_admin.py
--  to regenerate hashes for your own environment)

-- INSERT INTO users (name, email, password_hash, role, department, status)
-- VALUES
-- ('Priya Sharma', 'pm@teampulse.com', '<bcrypt-hash-here>', 'PROJECT_MANAGER', 'Delivery', 'ACTIVE'),
-- ('Rahul Verma',  'lead@teampulse.com', '<bcrypt-hash-here>', 'TEAM_LEAD', 'Engineering', 'ACTIVE'),
-- ('Anita Rao',    'dev@teampulse.com', '<bcrypt-hash-here>', 'DEVELOPER', 'Engineering', 'ACTIVE'),
-- ('Karthik Iyer', 'qa@teampulse.com', '<bcrypt-hash-here>', 'QA_TESTER', 'Quality', 'ACTIVE'),
-- ('Meera Nair',   'client@teampulse.com', '<bcrypt-hash-here>', 'CLIENT', NULL, 'ACTIVE');

-- Uncomment and generate real hashes via seed_admin.py's helper,
-- or just create these users through the Admin UI once logged in.
