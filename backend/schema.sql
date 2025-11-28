
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(150) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(50) DEFAULT 'User',
    CreatedAt DATETIME DEFAULT GETDATE()
);


CREATE TABLE Dashboards (
    DashboardId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE UserDashboards (
    UserDashboardId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL FOREIGN KEY REFERENCES Users(UserId),
    DashboardId INT NOT NULL FOREIGN KEY REFERENCES Dashboards(DashboardId),
    Role NVARCHAR(50) DEFAULT 'Viewer',     -- e.g., 'Owner', 'Editor', 'Viewer'
    JoinedAt DATETIME DEFAULT GETDATE(),
    UNIQUE (UserId, DashboardId)            -- Prevent duplicate membership
);

CREATE TABLE Boards (
    BoardId INT IDENTITY(1,1) PRIMARY KEY,
    DashboardId INT FOREIGN KEY REFERENCES Dashboards(DashboardId),
    Name NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Tasks (
    -- Identifiers
    TaskId INT IDENTITY(100,1) PRIMARY KEY,
    BoardId INT FOREIGN KEY REFERENCES Boards(BoardId) NOT NULL,
    
    Position INT NOT NULL DEFAULT 0, --for ordering
    -- User Provided Fields
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NULL, --optional
    -- Automatic Generated Fields
    CreatedBy NVARCHAR(100) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    -- AI Generates the following fields
    AssignedAgent NVARCHAR(MAX) NULL, --manual/auto (csv)
    Skills NVARCHAR(MAX) NULL, --manual/auto
    Category NVARCHAR(100) NULL,
    Status NVARCHAR(50) NULL,
    EstimatedDuration NVARCHAR(50) NULL,
    AgentMatchScore INT NULL,
    AgentProgress INT NULL,
    Dependencies NVARCHAR(MAX) NULL,        
);



