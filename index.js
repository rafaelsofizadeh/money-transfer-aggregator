require("./quoteGetters").then((quoteGetters) => {
  const express = require("express");
  const api = express();
  api.use(express.urlencoded({ extended: true }));
  api.use(express.json());

  api.listen(process.env.PORT || require("./config.json")["port"], () => {
    api.get("/", require("./controller")(quoteGetters));
    console.log("READY");
  });
});
