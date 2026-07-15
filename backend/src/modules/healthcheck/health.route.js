import { Router } from "express";
import { healthCheck } from "./health.controller.js";

const Healthroute = Router();

Healthroute.get("/", healthCheck)

export default Healthroute;