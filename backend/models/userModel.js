const sql = require("mssql");
const pool = require("../dbConfig");

async function createUser(fullName, email, passwordHash) {
  return pool
    .request()
    .input("FullName", sql.NVarChar(100), fullName)
    .input("Email", sql.NVarChar(150), email)
    .input("PasswordHash", sql.NVarChar(255), passwordHash).query(`
        INSERT INTO Users (FullName, Email, PasswordHash)
        VALUES (@FullName, @Email, @PasswordHash)
      `);
}

async function findByEmail(email) {
  return pool
    .request()
    .input("Email", sql.NVarChar(150), email)
    .query(`SELECT * FROM Users WHERE Email = @Email`);
}

async function getAll() {
  return pool.request().query(`SELECT * FROM Users`);
}

async function getById(id) {
  return pool
    .request()
    .input("UserId", sql.Int, id)
    .query(`SELECT * FROM Users WHERE UserId = @UserId`);
}

async function deleteUser(id) {
  return pool
    .request()
    .input("UserId", sql.Int, id)
    .query(`DELETE FROM Users WHERE UserId = @UserId`);
}

async function updateUser(id, fullName, email) {
  return pool
    .request()
    .input("UserId", sql.Int, id)
    .input("FullName", sql.NVarChar(100), fullName)
    .input("Email", sql.NVarChar(150), email).query(`
        UPDATE Users
        SET FullName = @FullName, Email = @Email
        WHERE UserId = @UserId
      `);
}

module.exports = {
  createUser,
  findByEmail,
  getAll,
  getById,
  deleteUser,
  updateUser,
};
