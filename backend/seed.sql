INSERT INTO Users (FullName, Email, PasswordHash, Role)
VALUES
('Lynus Lim', 'lynus@example.com', 'hashed_password_123', 'Admin'),
('Ariel Tan', 'ariel@example.com', 'hashed_password_456', 'User'),
('Falak A.', 'falak@example.com', 'hashed_password_789', 'User');

-- Admin = Owner, Regular User = Viewer
INSERT INTO UserDashboards (UserId, DashboardId, Role)
VALUES
(1, 1, 'Owner'),
(2, 1, 'Viewer');

INSERT INTO Dashboards (Name, Description)
VALUES
('Project Alpha', 'Main dashboard for Project Alpha');

INSERT INTO Boards (DashboardId, Name)
VALUES
(1, 'Backlog'),
(1, 'In Progress'),
(1, 'Completed');

--  #region Kanban Board
-- Backlog Board (BoardId = 1)
INSERT INTO Tasks (
    BoardId, Position, Title, Description, CreatedBy,
    AssignedAgent, Skills, Category, Status, EstimatedDuration, 
    AgentMatchScore, AgentProgress, Dependencies
)
VALUES
(1, 0, 'Set up project structure', 'Initialize folder structure and configs.', 'Admin User',
 'AgentA', 'setup,config', 'Setup', 'Pending', '2h', 85, 0, NULL),
(1, 1, 'Define requirements', 'Collect and draft initial requirements.', 'Admin User',
 'AgentB', 'analysis,writing', 'Documentation', 'Pending', '4h', 78, 0, NULL);

-- In Progress Board (BoardId = 2)
INSERT INTO Tasks (
    BoardId, Position, Title, Description, CreatedBy,
    AssignedAgent, Skills, Category, Status, EstimatedDuration, 
    AgentMatchScore, AgentProgress, Dependencies
)
VALUES
(2, 0, 'Create database schema', 'Design SQL schema and relationships.', 'Admin User',
 'AgentA', 'sql,db-design', 'Development', 'In Progress', '3h', 90, 45, '100');

-- Completed Board (BoardId = 3)
INSERT INTO Tasks(
    BoardId, Position, Title, Description, CreatedBy,
    AssignedAgent, Skills, Category, Status, EstimatedDuration,
    AgentMatchScore, AgentProgress, Dependencies
)
VALUES
(3, 0, 'Create wireframes', 'Initial UI/UX wireframes completed.', 'Regular User',
 NULL, NULL, 'Design', 'Done', '1h', NULL, 100, NULL);

-- #endregion Kanban Board

