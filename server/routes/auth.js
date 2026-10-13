const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ==================================================
// REGISTER
// POST /api/auth/register
// ==================================================

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please provide name, email, and password"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long"
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: cleanEmail
    });

    if (existingUser) {
      return res.status(400).json({
        message: "An account with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: "staff"
    });

    return res.status(201).json({
      message: "Account created successfully. Please log in.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: "Server error during registration",
      error: error.message
    });
  }
});

// ==================================================
// LOGIN
// POST /api/auth/login
// ==================================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password"
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    console.log("LOGIN ATTEMPT:", cleanEmail);

    const user = await User.findOne({
      email: cleanEmail
    }).select("+password");

    if (!user) {
      console.log("USER NOT FOUND:", cleanEmail);

      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    console.log("USER FOUND:", user.email);
    console.log("ROLE:", user.role);
    console.log("PASSWORD EXISTS:", !!user.password);

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      console.log("PASSWORD DOES NOT MATCH");

      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    console.log("PASSWORD MATCHED");

    const token = generateToken(user._id);

    console.log("LOGIN SUCCESS:", user.email);

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Server error during login",
      error: error.message
    });
  }
});

// ==================================================
// GET CURRENT USER
// GET /api/auth/me
// ==================================================

router.get("/me", protect, async (req, res) => {
  try {
    return res.status(200).json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });

  } catch (error) {
    console.error("GET USER ERROR:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

// ==================================================
// UPDATE PROFILE
// PUT /api/auth/profile
// ==================================================

router.put("/profile", protect, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const cleanEmail = email.toLowerCase().trim();

      const existingUser = await User.findOne({
        email: cleanEmail
      });

      if (existingUser) {
        return res.status(400).json({
          message: "A user with this email already exists"
        });
      }

      user.email = cleanEmail;
    }

    if (name) {
      user.name = name.trim();
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters long"
        });
      }

      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

module.exports = router;