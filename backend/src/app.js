import express from "express";
import { Middleware } from "./app.middleware.js";
import path from "path";
import Healthroute from "./modules/healthcheck/health.route.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import Userroute from "./modules/user/user.routes.js";

const app = express()


Middleware(app)

app.use('/api/v1/health', Healthroute)
app.use('/api/v1/user', Userroute)


app.get(/(.*)/, (req, res) => {
    res.sendFile(path.resolve("public", "dist", "index.html"));
});

app.use(errorHandler);

export default app