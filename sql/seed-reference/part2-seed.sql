-- =====================================================================
-- TEAMPULSE — PART 2 — SEED / TEST DATA
-- =====================================================================
-- NOTE: This assumes the following users already exist in the shared
-- `users` table, created by Part 1. Adjust IDs to match your real
-- Part 1 data before running. IDs below are illustrative only.
--
--  id | name              | role
--  ---|-------------------|-----------------
--   1 | Admin User        | ADMIN
--   2 | Priya Sharma      | PROJECT_MANAGER
--   3 | Arjun Mehta       | PROJECT_MANAGER
--   4 | Rahul Verma       | TEAM_LEAD
--   5 | Sana Iqbal        | TEAM_LEAD
--   6 | Dev One  (Ana)    | DEVELOPER
--   7 | Dev Two  (Ben)    | DEVELOPER
--   8 | Dev Three (Chen)  | DEVELOPER
--   9 | Dev Four (Divya)  | DEVELOPER
--  10 | Dev Five (Eshan)  | DEVELOPER
--  11 | Acme Corp Client  | CLIENT
--  12 | Global Bank Client| CLIENT
-- =====================================================================

USE teampulse;

-- ---------------------------------------------------------------------
-- PROJECTS
-- ---------------------------------------------------------------------
INSERT INTO projects
  (name, project_code, description, category, manager_id, client_id,
   start_date, end_date, priority, status, health, budget, department)
VALUES
  ('E-Commerce Platform Revamp', 'ECOM-2026', 
   'Rebuild the storefront and checkout flow on a modern stack.',
   'Web Application', 2, 11,
   '2026-01-15', '2026-11-30', 'HIGH', 'ACTIVE', 'GREEN', 450000.00, 'Engineering'),

  ('Core Banking Integration', 'BANK-2026',
   'Integrate core banking APIs with the new mobile banking app.',
   'Fintech', 2, 12,
   '2026-03-01', '2026-09-15', 'CRITICAL', 'ACTIVE', 'YELLOW', 780000.00, 'Engineering'),

  ('Internal HR Portal', 'HRPORTAL-25',
   'Self-service portal for leave, payroll and onboarding.',
   'Internal Tools', 3, NULL,
   '2025-09-01', '2026-02-28', 'MEDIUM', 'ON_HOLD', 'RED', 120000.00, 'IT Operations'),

  ('Marketing Analytics Dashboard', 'MKT-DASH-26',
   'Unified analytics dashboard for campaign performance.',
   'Data & Analytics', 3, 11,
   '2026-02-01', '2026-06-01', 'LOW', 'COMPLETED', 'GREEN', 60000.00, 'Marketing');

-- ---------------------------------------------------------------------
-- TEAMS
-- ---------------------------------------------------------------------
INSERT INTO teams (project_id, name, description, team_lead_id) VALUES
  (1, 'Team Alpha', 'Frontend + checkout squad', 4),
  (1, 'Team Beta',  'Backend & catalog squad', 5),
  (2, 'Team Gamma', 'Core banking API integration squad', 4),
  (3, 'Team Delta', 'HR portal build squad', 5),
  (4, 'Team Epsilon', 'Analytics & reporting squad', 4);

-- ---------------------------------------------------------------------
-- TEAM MEMBERS
-- ---------------------------------------------------------------------
INSERT INTO team_members (team_id, user_id) VALUES
  (1, 6), (1, 7), (1, 8),          -- Team Alpha: Ana, Ben, Chen
  (2, 9), (2, 10),                 -- Team Beta: Divya, Eshan
  (3, 6), (3, 9),                  -- Team Gamma: Ana, Divya (multi-project dev)
  (4, 7), (4, 8),                  -- Team Delta: Ben, Chen
  (5, 10);                         -- Team Epsilon: Eshan

-- ---------------------------------------------------------------------
-- MILESTONES
-- ---------------------------------------------------------------------
INSERT INTO milestones (project_id, name, description, due_date, status, progress) VALUES
  (1, 'Checkout Flow Redesign', 'New cart & checkout UX shipped to staging', '2026-04-30', 'COMPLETED', 100),
  (1, 'Payment Gateway Integration', 'Stripe + Razorpay integration', '2026-07-15', 'IN_PROGRESS', 55),
  (1, 'Go-Live', 'Production launch', '2026-11-30', 'NOT_STARTED', 0),

  (2, 'Core API Contract Sign-off', 'Bank confirms API contract', '2026-04-01', 'COMPLETED', 100),
  (2, 'Sandbox Integration', 'Integrate against bank sandbox', '2026-06-30', 'DELAYED', 40),
  (2, 'Security Audit', 'Third-party penetration test', '2026-08-15', 'NOT_STARTED', 0),

  (3, 'Requirements Freeze', 'Finalize HR portal scope', '2025-10-01', 'COMPLETED', 100),
  (3, 'Payroll Module', 'Payroll calculation engine', '2026-01-15', 'DELAYED', 20),

  (4, 'Dashboard MVP', 'First working dashboard with 3 core reports', '2026-04-01', 'COMPLETED', 100),
  (4, 'Client Handover', 'Docs + training for marketing team', '2026-06-01', 'COMPLETED', 100);

-- ---------------------------------------------------------------------
-- ACTIVITY LOG
-- ---------------------------------------------------------------------
INSERT INTO project_activity (project_id, user_id, action, details) VALUES
  (1, 2, 'PROJECT_CREATED', 'Project "E-Commerce Platform Revamp" created'),
  (1, 2, 'TEAM_ADDED', 'Team Alpha assigned to project'),
  (1, 2, 'TEAM_ADDED', 'Team Beta assigned to project'),
  (1, 4, 'MILESTONE_UPDATED', 'Checkout Flow Redesign marked COMPLETED'),
  (2, 2, 'PROJECT_CREATED', 'Project "Core Banking Integration" created'),
  (2, 2, 'HEALTH_CHANGED', 'Health changed from GREEN to YELLOW due to sandbox delay');
