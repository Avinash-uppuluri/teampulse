-- =====================================================================
-- TEAMPULSE — MERGED SCHEMA (Parts 1-4)
-- =====================================================================
-- Assembled from each part's standalone schema.sql during the Part 1-4
-- merge. Run this single file against a fresh MySQL 8.x instance.
--
-- FIX (merge): Part 1 created database `teampulse_db`; Part 2 and Part 3
-- each separately created/used a *different* database named `teampulse`.
-- Left as-is, Part 2/3's tables would have been created in the wrong
-- database. This merged file uses Part 1's name (`teampulse_db`, also
-- what backend/config.py defaults DB_NAME to) throughout, and Part 2's
-- own CREATE DATABASE/commented `users` reference stub has been removed
-- entirely (Part 1's real `users` table below is authoritative).
-- =====================================================================

-- =====================================================
-- TeamPulse — Centralized Database Schema
-- This is the ONE database shared by Parts 1, 2, 3, 4.
-- Part 1 owns the `users` table. Parts 2/3/4 should
-- reference users.id as a foreign key — never create a
-- second users table.
-- =====================================================

CREATE DATABASE IF NOT EXISTS teampulse_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE teampulse_db;

-- ---------------------------------------------------
-- USERS  (Part 1)
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150)  NOT NULL,
  email           VARCHAR(191)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,
  role            ENUM(
                    'ADMIN',
                    'PROJECT_MANAGER',
                    'TEAM_LEAD',
                    'DEVELOPER',
                    'QA_TESTER',
                    'CLIENT'
                  ) NOT NULL,
  department      VARCHAR(100)  NULL,
  profile_image   VARCHAR(255)  NULL,
  status          ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  last_login      DATETIME      NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_users_role (role),
  INDEX idx_users_status (status),
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- Placeholder tables other parts will add later, e.g.:
--
-- CREATE TABLE projects (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   name VARCHAR(200) NOT NULL,
--   project_manager_id INT,
--   FOREIGN KEY (project_manager_id) REFERENCES users(id)
-- );
--
-- CREATE TABLE tasks (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   project_id INT,
--   assigned_to INT,
--   FOREIGN KEY (assigned_to) REFERENCES users(id)
-- );
--
-- Not created here — Part 1 only owns Auth/Users.
-- ---------------------------------------------------

-- =====================================================================
-- PART 2 — Projects / Teams / Milestones / Activity
-- =====================================================================

-- =====================================================================
-- PROJECTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS projects (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(200)  NOT NULL,
  project_code VARCHAR(50)   NOT NULL UNIQUE,
  description  TEXT          NULL,
  category     VARCHAR(100)  NULL,

  manager_id   INT           NOT NULL,   -- FK -> users.id (role = PROJECT_MANAGER)
  client_id    INT           NULL,       -- FK -> users.id (role = CLIENT)

  start_date   DATE          NULL,
  end_date     DATE          NULL,       -- deadline

  priority     ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  status       ENUM('PLANNING','ACTIVE','ON_HOLD','COMPLETED','CANCELLED','ARCHIVED')
                 NOT NULL DEFAULT 'PLANNING',
  health       ENUM('GREEN','YELLOW','RED') NOT NULL DEFAULT 'GREEN',

  budget       DECIMAL(14,2) NULL,
  department   VARCHAR(100)  NULL,

  is_archived  TINYINT(1)    NOT NULL DEFAULT 0,

  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_projects_manager FOREIGN KEY (manager_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_projects_client FOREIGN KEY (client_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_projects_manager (manager_id),
  INDEX idx_projects_client (client_id),
  INDEX idx_projects_status (status),
  INDEX idx_projects_health (health),
  INDEX idx_projects_priority (priority)
) ENGINE=InnoDB;

-- =====================================================================
-- TEAMS
-- =====================================================================
CREATE TABLE IF NOT EXISTS teams (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  project_id   INT           NOT NULL,
  name         VARCHAR(150)  NOT NULL,
  description  TEXT          NULL,
  team_lead_id INT           NULL,       -- FK -> users.id (role = TEAM_LEAD)

  is_archived  TINYINT(1)    NOT NULL DEFAULT 0,

  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_teams_project FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_teams_lead FOREIGN KEY (team_lead_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  UNIQUE KEY uq_team_name_per_project (project_id, name),
  INDEX idx_teams_project (project_id),
  INDEX idx_teams_lead (team_lead_id)
) ENGINE=InnoDB;

-- =====================================================================
-- TEAM MEMBERS  (developers inside a team)
-- =====================================================================
CREATE TABLE IF NOT EXISTS team_members (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  team_id    INT       NOT NULL,
  user_id    INT       NOT NULL,        -- FK -> users.id (role = DEVELOPER, typically)
  joined_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES teams(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  UNIQUE KEY uq_team_member (team_id, user_id),
  INDEX idx_team_members_team (team_id),
  INDEX idx_team_members_user (user_id)
) ENGINE=InnoDB;

-- =====================================================================
-- MILESTONES
-- =====================================================================
CREATE TABLE IF NOT EXISTS milestones (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  project_id  INT          NOT NULL,
  name        VARCHAR(200) NOT NULL,
  description TEXT         NULL,
  due_date    DATE         NULL,
  status      ENUM('NOT_STARTED','IN_PROGRESS','COMPLETED','DELAYED')
                NOT NULL DEFAULT 'NOT_STARTED',
  progress    TINYINT UNSIGNED NOT NULL DEFAULT 0,  -- 0-100

  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_milestones_project FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_milestone_progress CHECK (progress BETWEEN 0 AND 100),

  INDEX idx_milestones_project (project_id),
  INDEX idx_milestones_status (status),
  INDEX idx_milestones_due_date (due_date)
) ENGINE=InnoDB;

-- =====================================================================
-- ACTIVITY LOG (lightweight, powers the "Activity" tab on Project Details)
-- Part 3 / Part 4 may also write into this table for a unified feed.
-- =====================================================================
CREATE TABLE IF NOT EXISTS project_activity (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  project_id  INT          NOT NULL,
  user_id     INT          NULL,        -- who performed the action
  action      VARCHAR(100) NOT NULL,    -- e.g. 'PROJECT_CREATED', 'TEAM_ADDED'
  details     TEXT         NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_activity_project FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_activity_project (project_id),
  INDEX idx_activity_created (created_at)
) ENGINE=InnoDB;

-- =====================================================================
-- PART 3 — Tasks
-- =====================================================================

-- ============================================================
-- TeamPulse - Part 3: Task Management & Developer Workspace
-- ============================================================
-- Run this AFTER Part 1 (users) and Part 2 (projects, teams,
-- team_members) schemas already exist in the `teampulse` database.
-- This file only creates the 4 tables Part 3 owns. It never
-- touches users, projects, teams, or team_members.
-- ============================================================

USE teampulse_db;

-- ------------------------------------------------------------
-- tasks
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    project_id      INT NOT NULL,
    team_id         INT NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    assigned_to     INT NULL,
    created_by      INT NOT NULL,
    priority        ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    status          ENUM('NOT_STARTED','IN_PROGRESS','IN_REVIEW','COMPLETED','BLOCKED')
                        NOT NULL DEFAULT 'NOT_STARTED',
    progress        TINYINT UNSIGNED NOT NULL DEFAULT 0,
    start_date      DATE NULL,
    due_date        DATE NULL,
    estimated_hours DECIMAL(6,2) NULL,
    actual_hours    DECIMAL(6,2) NULL DEFAULT 0,
    category        VARCHAR(80) NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at    DATETIME NULL,

    CONSTRAINT chk_progress_range CHECK (progress BETWEEN 0 AND 100),

    CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tasks_team FOREIGN KEY (team_id) REFERENCES teams(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_tasks_created_by FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT,

    INDEX idx_tasks_project (project_id),
    INDEX idx_tasks_team (team_id),
    INDEX idx_tasks_assigned_to (assigned_to),
    INDEX idx_tasks_status (status),
    INDEX idx_tasks_priority (priority),
    INDEX idx_tasks_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- task_dependencies  (Task B "depends_on" Task A)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_dependencies (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    task_id             INT NOT NULL,
    depends_on_task_id  INT NOT NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_dep_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_dep_depends_on FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT uq_task_dependency UNIQUE (task_id, depends_on_task_id),
    CONSTRAINT chk_no_self_dependency CHECK (task_id <> depends_on_task_id),

    INDEX idx_dep_task (task_id),
    INDEX idx_dep_depends_on (depends_on_task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- task_comments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_comments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    task_id     INT NOT NULL,
    user_id     INT NOT NULL,
    comment     TEXT NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_comment_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_comment_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- task_submissions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_submissions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    task_id         INT NOT NULL,
    submitted_by    INT NOT NULL,
    description     TEXT,
    submission_url  VARCHAR(500),
    file_path       VARCHAR(500) NULL,
    submitted_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    review_status   ENUM('PENDING','APPROVED','CHANGES_REQUESTED') NOT NULL DEFAULT 'PENDING',
    reviewed_by     INT NULL,
    reviewed_at     DATETIME NULL,
    review_notes    TEXT NULL,

    CONSTRAINT fk_submission_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_user FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_submission_task (task_id),
    INDEX idx_submission_status (review_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- PART 4 — QA / Bugs / Monitoring / Reports / Client
-- =====================================================================

-- =====================================================================
-- TEAMPULSE — PART 4: QA, Bug Tracking, Project Monitoring, Reports
-- =====================================================================
-- This schema ONLY adds the tables owned by Part 4.
-- It assumes the following tables ALREADY EXIST from Parts 1-3:
--   users(id, name, email, role, ...)
--   projects(id, name, status, start_date, end_date, ...)
--   teams(id, name, lead_id, ...)
--   tasks(id, project_id, team_id, assigned_to, title, status,
--         due_date, completed_at, ...)
-- Do NOT recreate those tables here.
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- TEST CASES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS test_cases (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    project_id      INT NOT NULL,
    task_id         INT NULL,
    created_by      INT NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    steps           TEXT,
    expected_result TEXT,
    actual_result   TEXT,
    status          ENUM('NOT_RUN','PASSED','FAILED','BLOCKED') NOT NULL DEFAULT 'NOT_RUN',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tc_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_tc_task    FOREIGN KEY (task_id)    REFERENCES tasks(id)    ON DELETE SET NULL,
    CONSTRAINT fk_tc_user    FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE RESTRICT,
    INDEX idx_tc_project (project_id),
    INDEX idx_tc_status (status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- BUGS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bugs (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    project_id   INT NOT NULL,
    task_id      INT NULL,
    test_case_id INT NULL,
    reported_by  INT NOT NULL,
    assigned_to  INT NULL,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    severity     ENUM('CRITICAL','HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
    priority     ENUM('CRITICAL','HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
    status       ENUM('OPEN','ASSIGNED','IN_PROGRESS','FIXED','RETEST','CLOSED','REJECTED','REOPENED')
                 NOT NULL DEFAULT 'OPEN',
    environment  VARCHAR(255),
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at  DATETIME NULL,
    CONSTRAINT fk_bug_project  FOREIGN KEY (project_id)   REFERENCES projects(id)   ON DELETE CASCADE,
    CONSTRAINT fk_bug_task     FOREIGN KEY (task_id)      REFERENCES tasks(id)      ON DELETE SET NULL,
    CONSTRAINT fk_bug_tc       FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE SET NULL,
    CONSTRAINT fk_bug_reporter FOREIGN KEY (reported_by)  REFERENCES users(id)      ON DELETE RESTRICT,
    CONSTRAINT fk_bug_assignee FOREIGN KEY (assigned_to)  REFERENCES users(id)      ON DELETE SET NULL,
    INDEX idx_bug_project (project_id),
    INDEX idx_bug_status (status),
    INDEX idx_bug_severity (severity),
    INDEX idx_bug_assignee (assigned_to)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- BUG HISTORY (full lifecycle audit trail)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bug_history (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    bug_id     INT NOT NULL,
    changed_by INT NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    comment    TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bh_bug  FOREIGN KEY (bug_id)     REFERENCES bugs(id)  ON DELETE CASCADE,
    CONSTRAINT fk_bh_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_bh_bug (bug_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CLIENT FEEDBACK
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_feedback (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    client_id  INT NOT NULL,
    message    TEXT NOT NULL,
    rating     TINYINT CHECK (rating BETWEEN 1 AND 5),
    status     ENUM('NEW','REVIEWED','RESOLVED') NOT NULL DEFAULT 'NEW',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cf_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_cf_client  FOREIGN KEY (client_id)  REFERENCES users(id)    ON DELETE RESTRICT,
    INDEX idx_cf_project (project_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- PROJECT HEALTH SNAPSHOTS (lets health be recalculated + tracked over time)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_health_log (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    project_id    INT NOT NULL,
    health        ENUM('GREEN','YELLOW','RED') NOT NULL,
    reason        TEXT,
    calculated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_phl_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_phl_project (project_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CONFIGURABLE HEALTH THRESHOLDS (Part B requirement: "make it configurable")
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_config (
    id                          INT AUTO_INCREMENT PRIMARY KEY,
    config_key                  VARCHAR(64) UNIQUE NOT NULL,
    config_value                INT NOT NULL,
    description                 VARCHAR(255)
) ENGINE=InnoDB;

INSERT INTO health_config (config_key, config_value, description) VALUES
('yellow_overdue_task_pct', 10, 'Overdue task %% at or above this triggers YELLOW'),
('red_overdue_task_pct',    25, 'Overdue task %% at or above this triggers RED'),
('yellow_critical_bugs',    1,  'Open critical bugs at or above this triggers YELLOW'),
('red_critical_bugs',       3,  'Open critical bugs at or above this triggers RED'),
('yellow_open_bugs',        10, 'Total open bugs at or above this triggers YELLOW'),
('red_open_bugs',           25, 'Total open bugs at or above this triggers RED')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

SET FOREIGN_KEY_CHECKS = 1;
