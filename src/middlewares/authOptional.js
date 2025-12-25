import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const authOptional = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.userId).select(
      "_id role name email"
    );

    req.user = user || null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};
