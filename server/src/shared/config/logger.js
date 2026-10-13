import winston from "winston"; //A system that receives logs, formats them, and decides where to store/display them.
//Your logger.js is basically the central logging configuration for the entire backend.

import config from "./index.js"
import { formatISTString } from "../utils/dateUtils.js";

/**
 * Winston logger configuration
 * Provides logging!
 */
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (config.node_env === "production" ? 'info' : 'debug'), // Configurable log level
    format: winston.format.combine(
        winston.format.timestamp({ format: () => formatISTString() }),
        winston.format.errors({ stack: true }), //preserve the stack trace which tells us where the error happened.
        winston.format.splat(), //This supports printf-style string interpolation.
        winston.format.json() //This converts the log into structured JSON.
    ),

    defaultMeta: { service: "api-monitoring" },

    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: "error" }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ],
})

export default logger