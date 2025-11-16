const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

module.exports = {
  generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
  },

  verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }
};
