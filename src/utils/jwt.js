import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXP = process.env.ACCESS_TOKEN_EXP || "15m";
const REFRESH_EXP = process.env.REFRESH_TOKEN_EXP || "7d";

export const createAccessToken = (user) => {
  return jwt.sign({ userId: user._id, role: user.role }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXP,
  });
};

export const createRefreshToken = (user) => {
  // Include tokenVersion so we can revoke all refresh tokens by bumping tokenVersion.
  return jwt.sign(
    { userId: user._id, tokenVersion: user.tokenVersion },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXP }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};
