const puppeteer = require("puppeteer");

const Transferwise = require("./transferwise");
const easysendGetQuote = require("./easysend");
const MITM = require("./manInTheMiddle");

module.exports = (async () => {
  const browser = await puppeteer.launch();

  const transferwiseGetQuote = Transferwise(true);
  console.log("Transferwise init");
  const skrillGetQuote = await MITM(
    browser,
    "https://transfers.skrill.com/smt/calculator/marketing",
    "body > dr-root > div > ng-component > div > dr-transfer-calculator > div > ul > li.calculator__sender > dr-amount > label > input",
    "/preview"
  );
  console.log("Skrill init");
  const spokoGetQuote = await MITM(
    browser,
    "https://spoko.app",
    "#layout > div > div:nth-child(2) > div > div > div.hero > div.spokoRootIndex-calcWrapper.right > div > form > div:nth-child(1) > div:nth-child(2) > div.wrap > input",
    "/calculate"
  );
  console.log("Spoko init");

  return {
    transferwiseGetQuote,
    skrillGetQuote,
    spokoGetQuote,
    easysendGetQuote,
  };
})();
