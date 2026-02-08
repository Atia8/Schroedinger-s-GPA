const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "academic-victim-secret-key";

class AuthMiddleware {
  authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "No token provided. How typical." 
      });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ 
          success: false,
          message: "Invalid token. Much like your excuses." 
        });
      }
      req.user = user;
      next();
    });
  }
}

module.exports = new AuthMiddleware();