const sql = require("mssql");
require("dotenv").config();

// Validate basic env vars and provide sensible defaults to avoid "config.server" errors
const config = {
  user: process.env.DB_USER || null,
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_DATABASE || null,
  // If DB_SERVER isn't provided, default to localhost to avoid mssql complaining about missing server
  server: process.env.DB_SERVER || "localhost",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

// Create a single pool promise that other modules can await.
// If the connection fails, the promise will reject and callers should handle it gracefully.
let poolPromise;
try {
  poolPromise = sql.connect(config);
} catch (err) {
  console.error("[dbConfig] Failed to initialize DB pool:", err?.message || err);
  // Provide a rejected promise so `await dbConfig` still behaves consistently
  poolPromise = Promise.reject(err);
}

module.exports = poolPromise;
