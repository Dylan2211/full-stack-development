const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwtUtils");
const userModel = require("../models/userModel");

module.exports = {
  // Register new user
  registerUser: async (req, res) => {
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
  },

  // Login existing user
  loginUser: async (req, res) => {
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
  },

  // Get all users
  getAllUsers: async (req, res) => {
    try {
      const result = await userModel.getAll();
      res.json(result.recordset);
    } catch (err) {
      console.error("Error retrieving users:", err);
      res.status(500).json({ message: "Error retrieving users" });
    }
  },

  // Get user by ID
  getUserById: async (req, res) => {
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
  },

  // Delete user
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      await userModel.deleteUser(id);

      res.json({ message: "User deleted successfully" });
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ message: "Error deleting user" });
    }
  }
};
