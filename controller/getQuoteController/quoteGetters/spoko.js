import MITM from "./manInTheMiddle.js";

export default (browser) =>
  MITM(
    browser,
    {
      senderCurrency: "sourceCurrency",
      recipientCurrency: "destinationCurrency",
      senderAmount: "sourceAmount",
    },
    undefined,
    undefined,
    "https://spoko.app",
    '#layout > div > div[ui-view="content"] > div > div > div.hero > div.spokoRootIndex-calcWrapper.right > div > form > div:not([class]) > div:nth-child(2) > div.wrap > input',
    "/calculate"
  );
