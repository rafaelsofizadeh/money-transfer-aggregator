import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import config from "./config.json";
import inputProcessingMiddleware from "./middleware/processInputMiddleware.js";
import getQuoteControllerConstructor from "./controller/getQuoteController/index.js";

const app = express();

/**
 * Middleware
 */

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "front/build")));

/**
 * Route middleware / controllers
 */

const browser = await puppeteer.launch({
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  ignoreHTTPSErrors: true,
  dumpio: false,
});

const getQuoteController = await getQuoteControllerConstructor(browser);

app.post("/getQuote", inputProcessingMiddleware, getQuoteController);

app.get("*", (request, response) => {
  response.sendFile(path.join(__dirname, "front/build/index.html"));
});

/**
 * Error handling
 */

app.use((error, req, res, next) => {
  return res.status(500).json({ error });
});

/**
 * Bootstrap
 */

app.listen(process.env.PORT || config["port"], () => {
  console.log("[index] App started");
});
