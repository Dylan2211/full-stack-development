const sql = require("mssql");
const pool = require("../dbConfig"); 

module.exports = {
  createUser: async (fullName, email, passwordHash) => {
    return pool.request()
      .input("FullName", sql.NVarChar(100), fullName)
      .input("Email", sql.NVarChar(150), email)
      .input("PasswordHash", sql.NVarChar(255), passwordHash)
      .query(`
        INSERT INTO Users (FullName, Email, PasswordHash)
        VALUES (@FullName, @Email, @PasswordHash)
      `);
  },

  // Find user by email
  findByEmail: async (email) => {
    return pool.request()
      .input("Email", sql.NVarChar(150), email)
      .query(`SELECT * FROM Users WHERE Email = @Email`);
  },

  // Get all users
  getAll: async () => {
    return pool.request()
      .query(`SELECT * FROM Users`);
  },

  // Get user by ID
  getById: async (id) => {
    return pool.request()
      .input("UserId", sql.Int, id)
      .query(`SELECT * FROM Users WHERE UserId = @UserId`);
  },

  deleteUser: async (id) => {
    return pool.request()
      .input("UserId", sql.Int, id)
      .query(`DELETE FROM Users WHERE UserId = @UserId`);
  }
};
