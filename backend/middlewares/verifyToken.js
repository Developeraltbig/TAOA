import jwt from "jsonwebtoken";
import User from "../models/User.js";
import BlacklistedToken from "../models/BlacklistedToken.js";

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.body.token;
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized: No token found",
      });
    }
    const blacklistItem = await BlacklistedToken.findOne({ token });
    if (blacklistItem) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized: Invalid token found",
      });
    }
    const secretKey = process.env.SECRET_KEY;
    const decoded = jwt.verify(token, secretKey);
    if (!decoded) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized: Invalid token found",
      });
    }
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "No user found",
      });
    }
    req.user = user;
    req.token = token;
    req.tokenExp = decoded.exp;
    next();
  } catch (error) {
    if (error.message === "jwt expired") {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized: JWT expired",
      });
    }
    next(error);
  }
};
