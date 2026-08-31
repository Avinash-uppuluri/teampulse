-- ============================================================
-- Sample data for Part 3.
--
-- ASSUMES the following already exist from Part 1 / Part 2 seed data:
--   users:  1 = Admin, 2 = Rahul (TEAM_LEAD), 3 = Dev One (DEVELOPER),
--           4 = Dev Two (DEVELOPER), 5 = Dev Three (DEVELOPER),
--           6 = PM One (PROJECT_MANAGER)
--   projects: 1 = "TeamPulse Platform"
--   teams:    1 = "Core Platform Team" (project_id=1, lead_id=2)
--   team_members: (team_id=1, user_id=3), (team_id=1, user_id=4), (team_id=1, user_id=5)
--
-- If your Part 1/2 seed IDs differ, adjust the values below.
-- ============================================================

USE teampulse;

INSERT INTO tasks
    (project_id, team_id, title, description, assigned_to, created_by,
     priority, status, progress, start_date, due_date, estimated_hours,
     actual_hours, category)
VALUES
    (1, 1, 'Design task database schema',
     'Design and document the tasks/comments/submissions schema.',
     3, 2, 'HIGH', 'COMPLETED', 100, '2026-08-01', '2026-08-05', 8, 7.5, 'Backend'),

    (1, 1, 'Build task REST API',
     'Implement CRUD, status, and progress endpoints for tasks.',
     3, 2, 'CRITICAL', 'IN_PROGRESS', 60, '2026-08-05', '2026-09-05', 20, 12, 'Backend'),

    (1, 1, 'Integrate API with frontend',
     'Wire up TaskList and TaskForm to the new task API.',
     4, 2, 'HIGH', 'NOT_STARTED', 0, NULL, '2026-09-10', 16, 0, 'Frontend'),

    (1, 1, 'Build Developer Dashboard UI',
     'Cards for total/completed/in-progress/blocked/overdue + progress ring.',
     4, 2, 'MEDIUM', 'IN_REVIEW', 90, '2026-08-10', '2026-08-31', 12, 11, 'Frontend'),

    (1, 1, 'Fix flaky task status transition bug',
     'BLOCKED -> IN_PROGRESS sometimes fails to clear the blocked flag.',
     5, 2, 'CRITICAL', 'BLOCKED', 30, '2026-08-15', '2026-08-20', 6, 4, 'Bugfix'),

    (1, 1, 'Write task calendar component',
     'Sortable upcoming-deadlines list with overdue highlighting.',
     5, 2, 'LOW', 'NOT_STARTED', 0, NULL, '2026-09-15', 10, 0, 'Frontend');

-- Task 3 ("Integrate API with frontend") depends on Task 2 ("Build task REST API")
INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (3, 2);

-- Comments
INSERT INTO task_comments (task_id, user_id, comment) VALUES
    (2, 2, 'Please make sure the status endpoint validates workflow transitions.'),
    (2, 3, 'Done - added STATUS_TRANSITIONS map with validation.'),
    (5, 5, 'Root cause found: progress was not resetting on unblock. Fixing now.');

-- Submissions
INSERT INTO task_submissions
    (task_id, submitted_by, description, submission_url, review_status)
VALUES
    (4, 4, 'Developer dashboard first pass, ready for review.',
     'https://github.com/example/teampulse/pull/42', 'PENDING');
