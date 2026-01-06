const jwt = require("jsonwebtoken");
require("dotenv").config();

let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn("Warning: JWT_SECRET is not set. Using insecure fallback secret. Set JWT_SECRET in environment for production.");
  JWT_SECRET = "supersecretkey";
}

function generateToken(payload, expiresIn = "24h") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken }; 
