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
    await userModel.createUser(username, email, hashed);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Registration error" });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.validatedBody;

    const result = await userModel.findByEmail(email);
    if (result.recordset.length === 0)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = result.recordset[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken({ id: user.id, email: user.email });

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Login error" });
  }
}

module.exports = { registerUser, loginUser };
