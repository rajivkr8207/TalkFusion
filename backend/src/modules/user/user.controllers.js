import { createUser, findUserByEmail, findUserByUsername, updateUserRefreshToken, removeUserRefreshToken, findUserById, findUserByRefreshToken } from "./user.services.js";
import jwt from "jsonwebtoken";
import { config } from "../../config/config.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const refreshTokenCookieOptions = {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
const accessTokenCookieOptions = {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

export const register = asyncHandler(async (req, res) => {
    const { username, name, email, password } = req.body;

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
        throw new ApiError(409, "User with this email already exists");
    }

    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
        throw new ApiError(409, "Username is already taken");
    }

    const user = await createUser({ username, name, email, password });

    const accessToken = user.generateToken();
    const refreshToken = user.generateRefreshToken();

    await updateUserRefreshToken(user._id, refreshToken);
    res.cookie("accessToken", accessToken, accessTokenCookieOptions);

    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    return res.status(201).json(
        new ApiResponse(201, {
            id: user._id,
            username: user.username,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            accessToken
        }, "User registered successfully")
    );
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    const isMatch = user.comparePassword(password);
    if (!isMatch) {
        throw new ApiError(401, "Invalid email or password");
    }

    const accessToken = user.generateToken();
    const refreshToken = user.generateRefreshToken();

    await updateUserRefreshToken(user._id, refreshToken);
    res.cookie("accessToken", accessToken, accessTokenCookieOptions);

    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    return res.status(200).json(
        new ApiResponse(200, {
            id: user._id,
            username: user.username,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
        }, "User logged in successfully")
    );
});

export const logout = asyncHandler(async (req, res) => {
    const user = req.user; // Assuming auth middleware sets this
    if (user) {
        await removeUserRefreshToken(user._id);
    }

    res.clearCookie("refreshToken", refreshTokenCookieOptions);

    return res.status(200).json(
        new ApiResponse(200, null, "User logged out successfully")
    );
});

export const profile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await findUserById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, user, "Profile fetched successfully")
    );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    const user = await findUserByRefreshToken(incomingRefreshToken);

    if (!user) {
        throw new ApiError(401, "Invalid refresh token");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, config.JWT_REFRESH_SECRET || config.JWT_SECRET);
        if (decodedToken.id !== user._id.toString()) {
            throw new ApiError(401, "Refresh token is invalid");
        }
    } catch (error) {
        throw new ApiError(401, "Refresh token expired or invalid");
    }

    const newAccessToken = user.generateToken();
    const newRefreshToken = user.generateRefreshToken();

    await updateUserRefreshToken(user._id, newRefreshToken);

    res.cookie("refreshToken", newRefreshToken, cookieOptions);

    return res.status(200).json(
        new ApiResponse(200, { accessToken: newAccessToken }, "Access token refreshed successfully")
    );
});