import http from "http";
import app from "./app.js";
import { config } from "./config/config.js";
import { initSocket } from "./sockets/server.sockets.js";
import logger from "./config/logger.js";
import { ConnectDb } from "./config/database.js";
const PORT = config.PORT

const httpserver = http.createServer(app);

initSocket(httpserver)
ConnectDb()
httpserver.listen(PORT, () => {
    logger.info(`server is running on ${PORT} port`);
})