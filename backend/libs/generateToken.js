import jwt from "jsonwebtoken";

export const generateToken = (userId) => {
  const secretKey = process.env.SECRET_KEY;
  const token = jwt.sign({ userId }, secretKey, {
    expiresIn: "1d",
  });
  return token;
};
