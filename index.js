require("./quoteGetters").then((quoteGetters) => {
  const express = require("express");
  const api = express();

  api.use(express.urlencoded({ extended: true }));
  api.use(express.json());
  api.use(require("./processInput"));

  api.get("/", require("./controller")(quoteGetters));

  api.listen(process.env.PORT || require("./config.json")["port"], () => {
    console.log("READY");
  });
});
