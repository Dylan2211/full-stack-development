CREATE TABLE Dashboards (
    DashboardId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Boards (
    BoardId INT IDENTITY(1,1) PRIMARY KEY,
    DashboardId INT FOREIGN KEY REFERENCES Dashboards(DashboardId),
    Name NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Tasks (
    TaskId INT IDENTITY(100,1) PRIMARY KEY,
    BoardId INT FOREIGN KEY REFERENCES Boards(BoardId),
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Category NVARCHAR(100) NULL,
    Priority NVARCHAR(50) NULL,
    Status NVARCHAR(50) NULL,
    RequiredSkills NVARCHAR(MAX) NULL,      -- Stored as JSON array
    EstimatedDuration NVARCHAR(50) NULL,
    AssignedAgent NVARCHAR(100) NULL,
    AgentMatchScore INT NULL,
    AgentProgress INT NULL,
    Dependencies NVARCHAR(MAX) NULL,        -- Stored as JSON array
    CreatedBy NVARCHAR(100) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL
);


CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(150) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(50) DEFAULT 'User',
    CreatedAt DATETIME DEFAULT GETDATE()
);


INSERT INTO Users (FullName, Email, PasswordHash, Role)
VALUES
('Lynus Lim', 'lynus@example.com', 'hashed_password_123', 'Admin'),
('Ariel Tan', 'ariel@example.com', 'hashed_password_456', 'User'),
('Falak A.', 'falak@example.com', 'hashed_password_789', 'User');
