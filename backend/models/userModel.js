const sql = require("mssql");
const poolPromise = require("../dbConfig");

async function createUser(fullName, email, passwordHash, role = "User") {
  const pool = await poolPromise;
  return pool
    .request()
    .input("FullName", sql.NVarChar(100), fullName)
    .input("Email", sql.NVarChar(150), email)
    .input("PasswordHash", sql.NVarChar(255), passwordHash)
    .input("Role", sql.NVarChar(50), role) 
    .query(
      `
      INSERT INTO Users (FullName, Email, PasswordHash, Role)
      VALUES (@FullName, @Email, @PasswordHash, @Role)
    `
    );
}

async function findByEmail(email) {
  const pool = await poolPromise;
  return pool
    .request()
    .input("Email", sql.NVarChar(150), email)
    .query(`SELECT * FROM Users WHERE Email = @Email`);
}

async function getAll() {
  const pool = await poolPromise;
  return pool.request().query(`SELECT * FROM Users ORDER BY UserId`);
}

async function getById(id) {
  const pool = await poolPromise;
  return pool
    .request()
    .input("UserId", sql.Int, id)
    .query(`SELECT * FROM Users WHERE UserId = @UserId`);
}

async function deleteUser(id) {
  const pool = await poolPromise;
  return pool
    .request()
    .input("UserId", sql.Int, id)
    .query(`DELETE FROM Users WHERE UserId = @UserId`);
}

async function updateUser(id, fullName, email) {
  const pool = await poolPromise;

  const request = pool.request().input("UserId", sql.Int, id);
  const sets = [];

  if (typeof fullName !== 'undefined') {
    request.input("FullName", sql.NVarChar(100), fullName);
    sets.push("FullName = @FullName");
  }
  if (typeof email !== 'undefined') {
    request.input("Email", sql.NVarChar(150), email);
    sets.push("Email = @Email");
  }

  if (sets.length === 0) {
    return { rowsAffected: [0] };
  }

  const query = `UPDATE Users SET ${sets.join(', ')} WHERE UserId = @UserId`;
  return request.query(query);
}

async function updatePassword(id, passwordHash) {
  const pool = await poolPromise;
  return pool
    .request()
    .input("UserId", sql.Int, id)
    .input("PasswordHash", sql.NVarChar(255), passwordHash)
    .query(`UPDATE Users SET PasswordHash = @PasswordHash WHERE UserId = @UserId`);
}

module.exports = {
  createUser,
  findByEmail,
  getAll,
  getById,
  deleteUser,
  updateUser,
  updatePassword,
};
