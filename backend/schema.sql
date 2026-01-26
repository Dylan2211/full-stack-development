CREATE DATABASE FullStack;
GO
USE FullStack;
GO

-- -- Drop and recreate the database
-- DROP DATABASE IF EXISTS FullStack;
-- GO
-- CREATE DATABASE FullStack;
-- GO
-- USE FullStack;

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
    IsPrivate BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE UserDashboards (
    UserDashboardId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL FOREIGN KEY REFERENCES Users(UserId),
    DashboardId INT NOT NULL FOREIGN KEY REFERENCES Dashboards(DashboardId) ON DELETE CASCADE,
    Role NVARCHAR(50) DEFAULT 'Viewer',     -- e.g., 'Owner', 'Editor', 'Viewer'
    JoinedAt DATETIME DEFAULT GETDATE(),
    UNIQUE (UserId, DashboardId)            -- Prevent duplicate membership
);

CREATE TABLE PendingInvitations (
    InvitationId INT IDENTITY(1,1) PRIMARY KEY,
    DashboardId INT NOT NULL FOREIGN KEY REFERENCES Dashboards(DashboardId) ON DELETE CASCADE,
    Email NVARCHAR(150) NOT NULL,
    Role NVARCHAR(50) DEFAULT 'Viewer',     -- 'Owner', 'Editor', 'Viewer'
    InvitedBy INT NOT NULL FOREIGN KEY REFERENCES Users(UserId),
    Token NVARCHAR(255) UNIQUE,              -- Unique invitation token
    Status NVARCHAR(50) DEFAULT 'Pending',   -- 'Pending', 'Accepted', 'Expired'
    CreatedAt DATETIME DEFAULT GETDATE(),
    ExpiresAt DATETIME,                      -- Optional expiration
    UNIQUE (DashboardId, Email)              -- Prevent duplicate invitations to same email
);

CREATE TABLE Boards (
    BoardId INT IDENTITY(1,1) PRIMARY KEY,
    DashboardId INT FOREIGN KEY REFERENCES Dashboards(DashboardId) ON DELETE CASCADE,
    Position INT NOT NULL DEFAULT 0, --for ordering
    Name NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Tasks (
    -- Identifiers
    TaskId INT IDENTITY(100,1) PRIMARY KEY,
    BoardId INT FOREIGN KEY REFERENCES Boards(BoardId) NOT NULL,
    
    Position INT NOT NULL DEFAULT 0, --for ordering
    -- User Provided Fields
    Title NVARCHAR(255) NULL,
    Description NVARCHAR(MAX) NULL, --optional
    -- Automatic Generated Fields
    CreatedBy INT NULL, -- UserId of creator
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
    Dependencies NVARCHAR(MAX) NULL,  --csv of TaskIds
    AIModel NVARCHAR(100) NULL,
    AIOutput NVARCHAR(MAX) NULL
);

-- Analytics logs for AI requests
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AiLogs]') AND type in (N'U'))
BEGIN
    CREATE TABLE AiLogs (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Timestamp DATETIME NOT NULL DEFAULT(GETDATE()),
        Model NVARCHAR(128) NULL,
        RequestPath NVARCHAR(255) NULL,
        Prompt NVARCHAR(MAX) NULL,
        TokensIn INT NULL,
        TokensOut INT NULL,
        ResponseTimeMs INT NULL,
        Status NVARCHAR(32) NULL,
        ErrorMessage NVARCHAR(MAX) NULL,
        Hallucination BIT NOT NULL DEFAULT(0),
        RetryCount INT NOT NULL DEFAULT(0),
        RequestId UNIQUEIDENTIFIER NULL,
        Accepted BIT NOT NULL DEFAULT(0)
    );
END