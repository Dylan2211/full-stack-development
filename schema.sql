CREATE TABLE Tasks (
    TaskId INT IDENTITY(100,1) PRIMARY KEY,
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
