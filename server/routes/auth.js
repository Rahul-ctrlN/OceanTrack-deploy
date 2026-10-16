
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Normalize email consistently
const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

// ==================================================
// REGISTER
// POST /api/auth/register
// ==================================================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail = normalizeEmail(email);

    if (!cleanName || !cleanEmail || typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "Please provide name, email, and password",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: "staff",
    });

    return res.status(201).json({
      message: "Account created successfully. Please log in.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    return res.status(500).json({
      message: "Server error during registration",
    });
  }
});

// ==================================================
// LOGIN
// POST /api/auth/login
// ==================================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "Please provide email and password",
      });
    }

    console.log("LOGIN ATTEMPT:", cleanEmail);

    // Password is select:false in the User schema,
    // so explicitly include it for password verification.
    const user = await User.findOne({
      email: cleanEmail,
    }).select("+password");

    if (!user) {
      console.log("LOGIN FAILED: USER NOT FOUND");

      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.password) {
      console.error("LOGIN ERROR: User has no stored password hash");

      return res.status(500).json({
        message: "Account password is not configured. Contact the administrator.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("LOGIN FAILED: PASSWORD MISMATCH");

      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    console.log("LOGIN SUCCESS:", user.email);

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error.message);

    return res.status(500).json({
      message: "Server error during login",
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
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error("GET USER ERROR:", error.message);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

// ==================================================
// UPDATE PROFILE
// PUT /api/auth/profile
// ==================================================
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Name cannot be empty",
        });
      }

      user.name = name.trim();
    }

    if (email !== undefined) {
      const cleanEmail = normalizeEmail(email);

      if (!cleanEmail) {
        return res.status(400).json({
          message: "Please provide a valid email",
        });
      }

      if (cleanEmail !== user.email) {
        const existingUser = await User.findOne({
          email: cleanEmail,
          _id: { $ne: user._id },
        });

        if (existingUser) {
          return res.status(409).json({
            message: "A user with this email already exists",
          });
        }

        user.email = cleanEmail;
      }
    }

    if (password !== undefined && password !== "") {
      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters long",
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
        role: user.role,
      },
    });
  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A user with this email already exists",
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
