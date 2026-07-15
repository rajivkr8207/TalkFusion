import jwt from "jsonwebtoken";
import { config } from "../../config/config.js";
import { findUserById } from "./user.services.js";

export const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken || (req.headers.authorization && req.headers.authorization.split(" ")[1]);

        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized access, no token provided." });
        }

        const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET || config.JWT_SECRET);
        
        const user = await findUserById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized access, user not found." });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Unauthorized access, invalid token." });
    }
};
