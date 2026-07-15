import { config } from "../config/config.js";

export const errorHandler = (err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
        stack: config.NODE_ENV === "development" ? err.stack : undefined
    });
};