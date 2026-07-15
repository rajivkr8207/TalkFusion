import express from "express";
import { register, login, logout, profile, refreshAccessToken } from "./user.controllers.js";
import { validateRegister, validateLogin } from "./user.validator.js";
import { requireAuth } from "./user.middleware.js";

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/logout", requireAuth, logout);
router.get("/profile", requireAuth, profile);
router.post("/refresh-token", refreshAccessToken);

export default router;
