import express from "express";
import bcryptjs from "bcryptjs";

import User from "../models/User.js";
import { generateToken } from "../libs/generateToken.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import BlacklistedToken from "../models/BlacklistedToken.js";

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const { email, fullName, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
      });
    } else if (password.length < 8) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 8 characters",
      });
    }
    const checkUserExists = await User.findOne({ email });
    if (checkUserExists) {
      return res.status(409).json({
        status: "error",
        message: "User already exists",
      });
    }
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    const updateData = {
      fullName,
      email,
      password: hashedPassword,
    };
    const newUser = new User(updateData);
    await newUser.save();
    const token = generateToken(newUser._id);
    return res.status(201).json({
      status: "success",
      message: "User registered",
      data: {
        userId: newUser.userId,
        name: newUser.fullName,
        email: newUser.email,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
      });
    }
    const checkUserExists = await User.findOne({ email });
    if (checkUserExists) {
      const checkPassword = await bcryptjs.compare(
        password,
        checkUserExists.password
      );
      if (checkPassword) {
        const token = generateToken(checkUserExists._id);
        return res.status(200).json({
          status: "success",
          message: "Login successful",
          data: {
            userId: checkUserExists.userId,
            name: checkUserExists.fullName,
            email: checkUserExists.email,
            token,
          },
        });
      } else {
        return res.status(401).json({
          status: "error",
          message: "Invalid credentials",
        });
      }
    } else {
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/logout", verifyToken, async (req, res, next) => {
  try {
    const token = req.body.token;
    const expiryAt = req.tokenExp;
    const blacklistedToken = new BlacklistedToken({ token, expiryAt });
    await blacklistedToken.save();
    return res.status(200).json({
      status: "success",
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
