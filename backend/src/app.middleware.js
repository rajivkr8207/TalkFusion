import cors from "cors";
import helmet from "helmet";
import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { config } from "./config/config.js";

export const Middleware = (app) => {
    app.use(cors({
        origin: config.CORS_ORIGIN,
        credentials: true
    }));
    app.use(morgan(config.ENV == 'development' ? 'dev' : 'tiny'))
    app.use(helmet());
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static('/public'))
}