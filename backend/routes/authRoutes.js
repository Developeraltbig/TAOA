import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import bcryptjs from "bcryptjs";
import nodemailer from "nodemailer";

import User from "../models/User.js";
import { generateToken } from "../libs/generateToken.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import BlacklistedToken from "../models/BlacklistedToken.js";

dotenv.config();
const router = express.Router();
const enviroment = process.env.NODE_ENV;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const CLIENT_URL = process.env.CLIENT_URL;

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

router.post("/forgotpassword", async (req, res, next) => {
  let user;

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        status: "success",
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const resetUrl = `${CLIENT_URL}/resetpassword/${resetToken}`;

    const mailOptions = {
      to: user.email,
      from: EMAIL_USER,
      subject: "Password Reset Request - TAOA.AI",
      html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; background-color: #f4f4f4;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <!-- Email Container -->
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td align="center" bgcolor="#3b82f6" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); background-color: #3b82f6; padding: 40px; border-radius: 8px 8px 0 0;">
                  <!--[if mso]>
                  <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:200px;">
                    <v:fill type="gradient" color="#3b82f6" color2="#2563eb" angle="45"/>
                    <v:textbox inset="0,0,0,0">
                  <![endif]-->
                  
                  <!-- Logo Circle with TAOA text -->
                  <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto 20px;">
                    <tr>
                      <td>
                        <table cellpadding="0" cellspacing="0" border="0" width="90" height="90" style="background-color: rgba(255,255,255,0.2); border-radius: 50%;">
                          <tr>
                            <td align="center" valign="middle" style="color: #ffffff; font-size: 24px; font-weight: 700; font-family: Arial, sans-serif; letter-spacing: 0.5px;">
                              TAOA
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Title -->
                  <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 600; font-family: Arial, sans-serif;">
                    Password Reset Request
                  </h1>
                  
                  <!--[if mso]>
                    </v:textbox>
                  </v:rect>
                  <![endif]-->
                </td>
              </tr>
              
              <!-- Body Content -->
              <tr>
                <td style="padding: 40px 40px 20px 40px;">
                  <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                    Hi ${user.fullName},
                  </p>
                  <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                    We received a request to reset the password for your account. If you made this request, please click the button below to reset your password:
                  </p>
                  
                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${resetUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); background-color: #3b82f6; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Alternative Link -->
                  <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0 0 10px 0;">
                      <strong>Or copy and paste this link into your browser:</strong>
                    </p>
                    <p style="color: #3b82f6; font-size: 14px; line-height: 20px; margin: 0; word-break: break-all;">
                      ${resetUrl}
                    </p>
                  </div>
                  
                  <!-- Security Notice -->
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <p style="color: #92400e; font-size: 14px; line-height: 20px; margin: 0;">
                      <strong>This link will expire in 1 hour</strong> for security reasons. If you need a new link, please request another password reset.
                    </p>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 20px 0 0 0;">
                    If you didn't request a password reset, please ignore this email. Your password will remain unchanged and your account is secure.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-radius: 0 0 8px 8px;">
                  <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0 0 10px 0;">
                    Need help? Contact our support team
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin: 0;">
                    © ${new Date().getFullYear()} TAOA&#8203;.AI. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
            
            <!-- Security Footer -->
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="margin-top: 20px;">
              <tr>
                <td style="text-align: center; padding: 0 40px;">
                  <p style="color: #6b7280; font-size: 12px; line-height: 18px; margin: 0;">
                    This is an automated message. Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
    };

    await transporter.sendMail(mailOptions);

    if (enviroment === "development") {
      console.log("Email sent to:", user.email);
    }

    res.status(200).json({
      status: "success",
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    if (enviroment === "development") {
      console.error("Forgot password error:", error);
    }
    if (user && user.resetPasswordToken) {
      user.resetPasswordToken = "";
      user.resetPasswordExpires = "";
      await user.save();
    }
    next(error);
  }
});

router.get("/verify-reset-token/:token", async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        status: "error",
        message: "Token is required",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired password reset link.",
      });
    }

    if (user && user?.resetPasswordExpires < Date.now()) {
      user.resetPasswordToken = "";
      user.resetPasswordExpires = null;
      await user.save();
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired password reset link.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Token is valid.",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/resetpassword", async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required.",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message:
          "Password reset token is invalid or has expired. Please request a new one.",
      });
    }

    if (user && user?.resetPasswordExpires < Date.now()) {
      user.resetPasswordToken = "";
      user.resetPasswordExpires = "";
      await user.save();
      return res.status(400).json({
        status: "error",
        message:
          "Password reset token is invalid or has expired. Please request a new one.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 8 characters long.",
      });
    }

    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(newPassword, salt);

    user.resetPasswordToken = "";
    user.resetPasswordExpires = null;

    await user.save();

    res.status(200).json({
      status: "success",
      message: "Your password has been successfully reset!",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
