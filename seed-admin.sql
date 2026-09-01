-- Run this once, after sql/schema.sql, to create the first login.
-- Part 1 has no public self-registration endpoint (by design — only an
-- existing ADMIN can create users via POST /api/admin/users), so the very
-- first admin has to be inserted directly like this.
--
-- Login:    admin@example.com
-- Password: changeme123   <-- CHANGE THIS as soon as you log in
-- (the hash below is that password run through bcrypt; generate your own
-- with `python3 -c "import bcrypt; print(bcrypt.hashpw(b'yourpassword', bcrypt.gensalt()).decode())"`
-- if you'd rather not use the default)

INSERT INTO users (name, email, password_hash, role, department, status)
VALUES (
  'Admin',
  'admin@example.com',
  '$2b$12$4NAyS4.mIquW6O19ioxNuOkG4JksQxNlcAvtx3mss2k1C2c8sarRO',
  'ADMIN',
  NULL,
  'ACTIVE'
);
