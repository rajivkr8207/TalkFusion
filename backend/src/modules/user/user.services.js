import { UserModel } from "./user.models.js";

export const createUser = async (userData) => {
    return await UserModel.create(userData);
};

export const findUserByEmail = async (email) => {
    return await UserModel.findOne({ email });
};

export const findUserByUsername = async (username) => {
    return await UserModel.findOne({ username });
};

export const findUserById = async (id) => {
    return await UserModel.findById(id).select("-password -refreshToken");
};

export const updateUserRefreshToken = async (userId, refreshToken) => {
    return await UserModel.findByIdAndUpdate(userId, { refreshToken }, { new: true });
};

export const removeUserRefreshToken = async (userId) => {
    return await UserModel.findByIdAndUpdate(userId, { refreshToken: "" }, { new: true });
};

export const findUserByRefreshToken = async (refreshToken) => {
    return await UserModel.findOne({ refreshToken });
};