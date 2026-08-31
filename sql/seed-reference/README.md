# Seed data (reference, not auto-merged)

Each part shipped its own demo/seed SQL file, kept here for reference.
They were NOT concatenated into one script because each part's seed data
assumes specific user IDs/roles already exist (per the comment block at
the top of each file) -- run part1-seed.sql first, check the actual user
IDs it creates, then adjust part2/3/4's seed files to match before running
them, in that order:

  part1-seed.sql  (users)
  part2-seed.sql  (projects, teams, milestones -- adjust manager_id/client_id/team_lead_id)
  part3-seed.sql  (tasks -- adjust assigned_to/created_by, project_id/team_id)
  part4-seed.sql  (QA/bugs -- adjust reported_by/assigned_to/client_id)
