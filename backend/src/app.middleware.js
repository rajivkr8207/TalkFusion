import cors from "cors";
import helmet from "helmet";
import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";

export const Middleware = (app) => {
    app.use(cors({
        origin: "*",
        credentials: true
    }));
    app.use(morgan('dev'))
    app.use(helmet());
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static('/public'))
}