import MITM from "./manInTheMiddle.js";

export default (browser) =>
  MITM(
    browser,
    undefined,
    undefined,
    undefined,
    "https://transfers.skrill.com/smt/calculator/marketing",
    "body > dr-root > div > ng-component > div > dr-transfer-calculator > div > ul > li.calculator__sender > dr-amount > label > input",
    "/preview",
    ({ recipientAmount }) => recipientAmount
    /*(result) => {
      console.log("CONDITION", Object.keys(result));
      return (
        result.error !== undefined &&
        result.error.message === "Authentication credentials expired"
      );
    }*/
  );
