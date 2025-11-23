const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwtUtils");
const userModel = require("../models/userModel");

async function registerUser(req, res) {
  try {
    const { username, email, password } = req.validatedBody;

    const existing = await userModel.findByEmail(email);
    if (existing.recordset.length > 0)
      return res.status(409).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    // Call createUser with FullName
    await userModel.createUser(username, email, hashed);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Registration error" });
  }
}

// Login existing user
async function loginUser(req, res) {
  try {
    const { email, password } = req.validatedBody;

    const result = await userModel.findByEmail(email);
    if (result.recordset.length === 0)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = result.recordset[0];
    const match = await bcrypt.compare(password, user.PasswordHash);

    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken({ id: user.UserId, email: user.Email });

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login error" });
  }
}

// Get all users
async function getAllUsers(req, res) {
  try {
    const result = await userModel.getAll();
    res.json(result.recordset);
  } catch (err) {
    console.error("Error retrieving users:", err);
    res.status(500).json({ message: "Error retrieving users" });
  }
}

// Get user by ID
async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const result = await userModel.getById(id);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error retrieving user:", err);
    res.status(500).json({ message: "Error retrieving user" });
  }
}

// Update user by ID
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { username, email } = req.body;

    const result = await userModel.updateUser(id, { username, email });

    if (!result.rowsAffected || result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", id });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Update user error" });
  }
}

// Delete user
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    await userModel.deleteUser(id);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Error deleting user" });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
