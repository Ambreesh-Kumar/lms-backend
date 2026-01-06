import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/User.js";

export const authFromQuery = async (req, res, next) => {
  const token = req.query.token;

  if (!token) {
    throw new ApiError(401, "Access token missing in query params");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).render("payments/unauthorized");
  }
};
