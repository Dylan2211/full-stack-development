const { verifyToken } = require("../utils/jwtUtils");

const authMiddleware = (req, res, next) => {
  try {
    const header = req.headers["authorization"];
    if (!header) return res.status(401).json({ message: "Missing Authorization header" });

    if (!header.startsWith("Bearer ")) return res.status(401).json({ message: "Invalid Authorization header" });

    const token = header.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Missing token" });

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { authMiddleware };
