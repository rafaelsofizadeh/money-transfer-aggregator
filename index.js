(async () => {
  const path = require("path");
  const express = require("express");
  const app = express();

  /**
   * Middleware
   */

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "./public")));

  /**
   * View engine
   */

  const fs = require("fs");

  const countryData = require("./countryData.json");

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "/public/views"));

  app.render(
    "partials/converter-form/country-selector-template.ejs",
    countryData,
    (error, html) => {
      if (error) {
        return console.log(
          `[index] Country selector template rendering error: ${error}`
        );
      }

      fs.writeFileSync(
        path.join(
          __dirname,
          "/public/views/partials/converter-form/country-selector.ejs"
        ),
        html
      );
    }
  );

  /**
   * Route middleware / controllers
   */

  const inputProcessingMiddleware = require("./middleware/processInputMiddleware");

  //const getQuoteController = await require("./controller/getQuoteController");
  const getQuoteTestController = require("./controller/getQuoteController/test");

  app.get("/", (request, response) => {
    return response.render("pages/main.ejs");
  });
  app.post("/getQuote", inputProcessingMiddleware, getQuoteTestController);

  /**
   * Bootstrap
   */

  const config = require("./config.json");

  app.listen(process.env.PORT || config["port"], () => {
    console.log("[index] App started");
  });
})();
