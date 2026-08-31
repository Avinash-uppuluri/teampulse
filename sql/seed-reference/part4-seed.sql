-- =====================================================================
-- SAMPLE DATA — for local testing only.
-- Assumes projects(id 1,2), tasks(id 1-6), users(id 1-6) already exist
-- from Parts 1-3. Adjust IDs to match your real data before running.
-- =====================================================================

-- Test cases
INSERT INTO test_cases (project_id, task_id, created_by, title, description, steps, expected_result, actual_result, status)
VALUES
(1, 1, 2, 'Login form validation', 'Verify required-field validation on login', '1. Open login\n2. Submit blank form', 'Inline errors shown for empty fields', 'Inline errors shown as expected', 'PASSED'),
(1, 2, 2, 'Task creation with past due date', 'Ensure past due dates are rejected', '1. Create task\n2. Set due date in the past\n3. Submit', 'Form blocks submission with error', 'Form allowed submission', 'FAILED'),
(1, 3, 2, 'Bug severity dropdown options', 'Confirm all 4 severities are selectable', '1. Open bug form\n2. Open severity dropdown', 'CRITICAL/HIGH/MEDIUM/LOW all present', NULL, 'NOT_RUN'),
(2, 4, 3, 'Dashboard chart renders on slow network', 'Chart.js should render with skeleton loader', '1. Throttle network\n2. Open dashboard', 'Skeleton shown then chart renders', NULL, 'BLOCKED');

-- Bugs
INSERT INTO bugs (project_id, task_id, test_case_id, reported_by, assigned_to, title, description, severity, priority, status, environment)
VALUES
(1, 2, 2, 2, 4, 'Past due dates accepted on task form', 'Backend does not validate due_date against current date', 'HIGH', 'HIGH', 'OPEN', 'staging'),
(1, 1, 1, 2, NULL, 'Login button double-submits on slow click', 'Rapid double click sends two requests', 'MEDIUM', 'MEDIUM', 'ASSIGNED', 'production'),
(2, 4, 4, 3, 5, 'Dashboard chart blank on 3G', 'Chart.js canvas stays empty under throttled network', 'CRITICAL', 'CRITICAL', 'IN_PROGRESS', 'staging');

-- Bug history
INSERT INTO bug_history (bug_id, changed_by, old_status, new_status, comment)
VALUES
(1, 2, NULL, 'OPEN', 'Initial report filed by QA'),
(2, 2, NULL, 'OPEN', 'Initial report filed by QA'),
(2, 3, 'OPEN', 'ASSIGNED', 'Assigned to frontend dev'),
(3, 3, NULL, 'OPEN', 'Initial report filed by QA'),
(3, 4, 'OPEN', 'ASSIGNED', 'Assigned to charting owner'),
(3, 5, 'ASSIGNED', 'IN_PROGRESS', 'Investigating canvas sizing issue');

-- Client feedback
INSERT INTO client_feedback (project_id, client_id, message, rating, status)
VALUES
(1, 6, 'Overall progress looks good, please prioritize the login bug.', 4, 'NEW'),
(2, 6, 'Dashboard is slow to load on our office network.', 3, 'REVIEWED');
