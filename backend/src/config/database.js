import mongoose from "mongoose"
import { config } from "./config.js";
import logger from "./logger.js";



export const ConnectDb = () => {
    mongoose.connect(config.MONGO_URI)
        .then(() => {
            logger.info("Database connected successfully")
        })
        .catch((error) => {
            logger.error("Error connecting to database: ", error)
            process.exit(1)
        })
}