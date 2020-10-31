const puppeteer = require("puppeteer");

const transferwiseGetQuote = require("./transferwise");
const easysendGetQuote = require("./easysend");
const azimoGetQuote = require("./azimo");
const MITM = require("./manInTheMiddle");

module.exports = (async () => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ignoreHTTPSErrors: true,
    dumpio: false,
  });

  const skrillGetQuote = await MITM(
    "skrill",
    browser,
    undefined,
    undefined,
    undefined,
    "https://transfers.skrill.com/smt/calculator/marketing",
    "body > dr-root > div > ng-component > div > dr-transfer-calculator > div > ul > li.calculator__sender > dr-amount > label > input",
    "/preview"
  );

  const spokoGetQuote = await MITM(
    "spoko",
    browser,
    {
      senderCurrency: "sourceCurrency",
      ecipientCurrency: "destinationCurrency",
      senderAmount: "sourceAmount",
    },
    undefined,
    undefined,
    "https://spoko.app",
    '#layout > div > div[ui-view="content"] > div > div > div.hero > div.spokoRootIndex-calcWrapper.right > div > form > div:not([class]) > div:nth-child(2) > div.wrap > input',
    "/calculate"
  );

  return {
    transferwiseGetQuote,
    skrillGetQuote,
    spokoGetQuote,
    easysendGetQuote,
    azimoGetQuote,
  };
})();
