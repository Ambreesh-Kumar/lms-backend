import { verifyAccessToken } from "../utils/jwt.js";
import {User} from "../models/User.js"


/**
 * Protect route via Authorization header:
 * Authorization: Bearer <accessToken>
 */

export const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"] || ""
        const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
        if(!token) return res.status(401).json({message: 'Unauthorized'});
        const userPayload = verifyAccessToken(token)
        const user = await User.findById(userPayload.userId).select("-password");
        if(!user) return res.status(401).json({message: "User not found"});
        req.user = user
        next();
    } catch (error) {
        console.error("Auth middleware error:", error)
        return res.status(401).json({message: "Invalid or expired token"})
    }
}