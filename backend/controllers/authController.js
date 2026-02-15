const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "academic-victim-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

class AuthController {
  async register(req, res) {
    try {
      const { email, password, username } = req.body;
      
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ 
          success: false,
          message: "User already exists. You're not special." 
        });
      }

      // Create user
      const user = await User.create({
        email,
        password,
        username: username || `Academic Victim ${Date.now().toString().slice(-4)}`
      });

      // Generate token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: "Account created successfully. Welcome to the void.",
        token,
        user: user.toJSON()
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ 
        success: false,
        message: "Internal server error. Much like your academic career." 
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: "Invalid credentials. Did you forget your email too?" 
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false,
          message: "Invalid credentials. Strong password, weak memory?" 
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: "Login successful. Your regrets await.",
        token,
        user: user.toJSON()
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ 
        success: false,
        message: "Internal server error. Try again later, or don't." 
      });
    }
  }
}

module.exports = new AuthController();