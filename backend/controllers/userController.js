const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwtUtils");
const userModel = require("../models/userModel");

async function registerUser(req, res) {
  try {
    const { fullName, email, password } = req.validatedBody;

    const existing = await userModel.findByEmail(email);
    if (existing.recordset.length > 0)
      return res.status(409).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    await userModel.createUser(fullName, email, hashed, 'User');

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Registration error" });
  }
}

// Login User
async function loginUser(req, res) {
  try {
    const { email, password } = req.validatedBody;

    const result = await userModel.findByEmail(email);
    if (result.recordset.length === 0)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = result.recordset[0];

    // Note: DB column is PasswordHash, distinct from input 'password'
    const match = await bcrypt.compare(password, user.PasswordHash);

    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken({ id: user.UserId, email: user.Email, role: user.Role });

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login error" });
  }
}

// Change password (authenticated)
async function changePassword(req, res) {
  try {
    const { id } = req.params;
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });
    if (requester.id !== parseInt(id, 10) && requester.role !== "Admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { currentPassword, newPassword } = req.validatedBody;

    const result = await userModel.getById(id);
    if (result.recordset.length === 0) return res.status(404).json({ message: "User not found" });
    const user = result.recordset[0];

    const match = await bcrypt.compare(currentPassword, user.PasswordHash);
    if (!match) return res.status(401).json({ message: "Invalid current password" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(id, hashed);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Change password error" });
  }
}

// Forgot password (issue reset token)
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const result = await userModel.findByEmail(email);

    // Always respond with success to avoid user enumeration
    if (result.recordset.length === 0) {
      return res.json({ message: "If the email exists, a reset link has been sent" });
    }

    const user = result.recordset[0];
    const token = require("../utils/jwtUtils").generateToken({ id: user.UserId, type: "reset" }, "1h");
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    console.log(`Password reset link for ${email}: ${resetLink}`);

    // For development convenience, return the token in the response when not in production
    const response = { message: "If the email exists, a reset link has been sent" };
    if (process.env.NODE_ENV !== "production") response.resetToken = token;

    res.json(response);
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Forgot password error" });
  }
}

// Reset password using token
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.validatedBody;
    const { verifyToken } = require("../utils/jwtUtils");
    const payload = verifyToken(token);
    if (!payload || payload.type !== "reset") return res.status(400).json({ message: "Invalid or expired token" });

    const userId = payload.id;
    const hashed = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(userId, hashed);

    res.json({ message: "Password has been reset" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Reset password error" });
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

    // Authorization: only the owner or an admin can update
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });
    if (requester.id !== parseInt(id, 10) && requester.role !== "Admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { username, fullName, email, password } = req.body; 

    if (password) {
      return res.status(400).json({ message: "Password cannot be changed via this endpoint" });
    }

    const nameToSet = typeof fullName !== 'undefined' ? fullName : username;

    if (typeof nameToSet === 'undefined' && typeof email === 'undefined') {
      return res.status(400).json({ message: "No updatable fields provided" });
    }

    const result = await userModel.updateUser(id, nameToSet, email);
    if (!result.rowsAffected || result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "User not found or no changes made" });
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

    // Authorization: only the owner or an admin can delete
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });
    if (requester.id !== parseInt(id, 10) && requester.role !== "Admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const result = await userModel.deleteUser(id);
    
    if (!result.rowsAffected || result.rowsAffected[0] === 0) {
       return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Error deleting user" });
  }
}

module.exports = {
  registerUser,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};