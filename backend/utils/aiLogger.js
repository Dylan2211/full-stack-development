const sql = require("mssql");
const poolPromise = require("../dbConfig");

let ensured = false;

async function ensureTable() {
  if (ensured) return;
  const pool = await poolPromise;
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AiLogs]') AND type in (N'U'))
    BEGIN
      CREATE TABLE [dbo].[AiLogs] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Timestamp] DATETIME NOT NULL DEFAULT(GETDATE()),
        [Model] NVARCHAR(128) NULL,
        [RequestPath] NVARCHAR(255) NULL,
        [Prompt] NVARCHAR(MAX) NULL,
        [TokensIn] INT NULL,
        [TokensOut] INT NULL,
        [ResponseTimeMs] INT NULL,
        [Status] NVARCHAR(32) NULL,
        [ErrorMessage] NVARCHAR(MAX) NULL,
        [Hallucination] BIT NOT NULL DEFAULT(0),
        [RetryCount] INT NOT NULL DEFAULT(0),
        [RequestId] UNIQUEIDENTIFIER NULL,
        [Accepted] BIT NOT NULL DEFAULT(0)
      );
    END
  `);
  ensured = true;
}

async function logAiRequest(entry) {
  try {
    await ensureTable();
    const pool = await poolPromise;
    const req = pool.request()
      .input("Model", sql.NVarChar, entry.model || null)
      .input("RequestPath", sql.NVarChar, entry.request_path || null)
      .input("Prompt", sql.NVarChar, entry.prompt || null)
      .input("TokensIn", sql.Int, Number.isFinite(entry.tokens_in) ? entry.tokens_in : null)
      .input("TokensOut", sql.Int, Number.isFinite(entry.tokens_out) ? entry.tokens_out : null)
      .input("ResponseTimeMs", sql.Int, Number.isFinite(entry.response_time_ms) ? entry.response_time_ms : null)
      .input("Status", sql.NVarChar, entry.status || null)
      .input("ErrorMessage", sql.NVarChar, entry.error_message || null)
      .input("Hallucination", sql.Bit, entry.hallucination ? 1 : 0)
      .input("RetryCount", sql.Int, Number.isFinite(entry.retry_count) ? entry.retry_count : 0)
      .input("RequestId", sql.UniqueIdentifier, entry.request_id || null)
      .input("Accepted", sql.Bit, entry.accepted ? 1 : 0);

    await req.query(`
      INSERT INTO [dbo].[AiLogs]
        (Model, RequestPath, Prompt, TokensIn, TokensOut, ResponseTimeMs, Status, ErrorMessage, Hallucination, RetryCount, RequestId, Accepted)
      VALUES
        (@Model, @RequestPath, @Prompt, @TokensIn, @TokensOut, @ResponseTimeMs, @Status, @ErrorMessage, @Hallucination, @RetryCount, @RequestId, @Accepted)
    `);
  } catch (err) {
    console.error("aiLogger.logAiRequest failed:", err?.message || err);
  }
}

module.exports = { logAiRequest };
