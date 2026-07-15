import mongoose from "mongoose";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken';
import { config } from "../../config/config.js";

const User = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        minLength: 6,
        maxLength: 50
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: 3,
        maxLength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"]
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    avatarUrl: {
        type: String,
        default: ""
    },
    refreshToken: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

User.pre("save", function () {
    if (!this.isModified("password")) return;
    this.password = bcrypt.hashSync(this.password, 10);
    return
})

User.methods.comparePassword = function (password) {
    return bcrypt.compareSync(password, this.password)
}

User.methods.generateToken = function () {
    return jwt.sign({ id: this._id }, config.JWT_SECRET, { expiresIn: "1d" })
}

User.methods.generateRefreshToken = function () {
    return jwt.sign({ id: this._id }, config.JWT_REFRESH_SECRET || config.JWT_SECRET, { expiresIn: "7d" })
}


export const UserModel = mongoose.model("User", User);