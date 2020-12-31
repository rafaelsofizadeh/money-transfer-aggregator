import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

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

/**
 * Bootstrap
 */

app.listen(process.env.PORT || config["port"], () => {
  console.log("[index] App started");
});
