import { createUser, findUserByEmail, findUserByUsername, updateUserRefreshToken, removeUserRefreshToken, findUserById, findUserByRefreshToken } from "./user.services.js";
import jwt from "jsonwebtoken";
import { config } from "../../config/config.js";

const cookieOptions = {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req, res) => {
    try {
        const { username, name, email, password } = req.body;
        console.log(req.body)
        const existingEmail = await findUserByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ success: false, message: "User with this email already exists." });
        }

        const existingUsername = await findUserByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ success: false, message: "Username is already taken." });
        }

        const user = await createUser({ username, name, email, password });

        const accessToken = user.generateToken();
        const refreshToken = user.generateRefreshToken();

        await updateUserRefreshToken(user._id, refreshToken);

        res.cookie("refreshToken", refreshToken, cookieOptions);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl
            },
            accessToken
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error during registration.", error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        const isMatch = user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        const accessToken = user.generateToken();
        const refreshToken = user.generateRefreshToken();

        await updateUserRefreshToken(user._id, refreshToken);

        res.cookie("refreshToken", refreshToken, cookieOptions);

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl
            },
            accessToken
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error during login.", error: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        const user = req.user; // Assuming auth middleware sets this
        if (user) {
            await removeUserRefreshToken(user._id);
        }

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: config.NODE_ENV === "production",
            sameSite: "strict",
        });

        return res.status(200).json({ success: true, message: "User logged out successfully." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error during logout.", error: error.message });
    }
};

export const profile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await findUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error fetching profile.", error: error.message });
    }
};

export const refreshAccessToken = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            return res.status(401).json({ success: false, message: "Unauthorized request." });
        }

        const user = await findUserByRefreshToken(incomingRefreshToken);

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid refresh token." });
        }

        try {
            const decodedToken = jwt.verify(incomingRefreshToken, config.JWT_REFRESH_SECRET || config.JWT_SECRET);
            if (decodedToken.id !== user._id.toString()) {
                return res.status(401).json({ success: false, message: "Refresh token is invalid." });
            }
        } catch (error) {
            return res.status(401).json({ success: false, message: "Refresh token expired or invalid." });
        }

        const newAccessToken = user.generateToken();
        const newRefreshToken = user.generateRefreshToken();

        await updateUserRefreshToken(user._id, newRefreshToken);

        res.cookie("refreshToken", newRefreshToken, cookieOptions);

        return res.status(200).json({
            success: true,
            message: "Access token refreshed successfully.",
            accessToken: newAccessToken
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error during token refresh.", error: error.message });
    }
};