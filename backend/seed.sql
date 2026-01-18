INSERT INTO Users (FullName, Email, PasswordHash, Role)
VALUES
('Lynus Lim', 'lynus@example.com', 'hashed_password_123', 'Admin'),
('Ariel Tan', 'ariel@example.com', 'hashed_password_456', 'User'),
('Falak A.', 'falak@example.com', 'hashed_password_789', 'User');

INSERT INTO Dashboards (Name, Description, IsPrivate)
VALUES
('EGRA Team Project', 'EGRA Dashboard for collaboration for work projects.', 1),
('Holiday Planning', 'Dashboard used to plan our holiday in December!', 1),
('Daily Task Manager', 'Keep track of daily tasks and provide suggestions on how to improve', 1),
('Gaming Checklist', 'Dashboard to check for optimizations for gaming performance', 0),
('Dashmi Task Board', 'Dashmi task board with Alison for weekend planning', 1),
('Assignment 1 FSDP', 'Dashboard to help provide help for Full Stack Development Assignment 1', 0),
('Dashboard 7', 'This dashboard is used for interesting purposes', 1);

-- Admin = Owner, Regular User = Viewer
INSERT INTO UserDashboards (UserId, DashboardId, Role)
VALUES
(1, 1, 'Owner'),
(1, 2, 'Owner'),
(1, 3, 'Owner'),
(1, 4, 'Owner'),
(1, 5, 'Owner'),
(1, 6, 'Owner'),
(1, 7, 'Owner'),
(2, 1, 'Viewer'),
(2, 2, 'Viewer'),
(3, 3, 'Viewer');


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
(1, 0, 'Set up project structure', 'Initialize folder structure and configs.', 1,
 'Ollama', 'setup,config', 'Setup', 'Pending', '2h', 85, 0, NULL),
(1, 1, 'Define requirements', 'Collect and draft initial requirements.', 1,
 'Ollama', 'analysis,writing', 'Documentation', 'Pending', '4h', 78, 0, NULL);

-- In Progress Board (BoardId = 2)
INSERT INTO Tasks (
    BoardId, Position, Title, Description, CreatedBy,
    AssignedAgent, Skills, Category, Status, EstimatedDuration, 
    AgentMatchScore, AgentProgress, Dependencies
)
VALUES
(2, 0, 'Create database schema', 'Design SQL schema and relationships.', 1,
 'Ollama', 'sql,db-design', 'Development', 'In Progress', '3h', 90, 45, '100');

-- Completed Board (BoardId = 3)
INSERT INTO Tasks(
    BoardId, Position, Title, Description, CreatedBy,
    AssignedAgent, Skills, Category, Status, EstimatedDuration,
    AgentMatchScore, AgentProgress, Dependencies
)
VALUES
(3, 0, 'Create wireframes', 'Initial UI/UX wireframes completed.', 2,
 NULL, NULL, 'Design', 'Done', '1h', NULL, 100, NULL);

-- #endregion Kanban Board

-- do profile, do collaborators page