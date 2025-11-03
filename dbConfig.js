const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  server: process.env.DB_SERVER,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

const poolPromise = sql.connect(config);

module.exports = poolPromise;
