const puppeteer = require("puppeteer-core");
const express = require("express");
const axios = require("axios");

const config = require("../config.json");
const mapping = config["mapping"];
const port = config["port"];

const api = express();
api.use(express.urlencoded({ extended: true }));
api.use(express.json());

api.all("*", async (request, response) => {
  const browser = await puppeteer.launch({});

  const transferwiseGetQuote = Transferwise(true);
  const skrillGetQuote = await RequestInterceptScraper(
    browser,
    "https://transfers.skrill.com/smt/calculator/marketing",
    "body > dr-root > div > ng-component > div > dr-transfer-calculator > div > ul > li.calculator__sender > dr-amount > label > input",
    "/preview"
  );
  const spokoGetQuote = await RequestInterceptScraper(
    browser,
    "https://spoko.app",
    "#layout > div > div:nth-child(2) > div > div > div.hero > div.spokoRootIndex-calcWrapper.right > div > form > div:nth-child(1) > div:nth-child(2) > div.wrap > input",
    "/calculate"
  );

  return controller({ transferwiseGetQuote, skrillGetQuote, spokoGetQuote })(
    request,
    response
  );
});

function controller({ transferwiseGetQuote, skrillGetQuote, spokoGetQuote }) {
  return async (request, response) => {
    const {
      senderCurrency,
      senderCountry,
      recipientCurrency,
      recipientCountry,
      senderAmount,
    } = request.query;

    if (
      !mapping.countryCodes[senderCountry] ||
      !mapping.countryCodes[recipientCountry]
    ) {
      response.status(400);
      return response.json({
        error: "Please enter a valid ISO 3166-1 alpha-3 country code.",
      });
    }

    if (
      mapping.currencyCodes.indexOf(senderCurrency) < 0 ||
      !mapping.currencyCodes.indexOf(recipientCurrency) < 0
    ) {
      response.status(400);
      return response.json({
        error: "Please enter a valid currency code.",
      });
    }

    const transferwiseResult = transferwiseGetQuote(
      senderCurrency,
      recipientCurrency,
      senderAmount
    );

    const skrillResult = await skrillGetQuote({
      senderCurrency,
      senderCountry,
      recipientCurrency,
      recipientCountry,
      senderAmount,
    });

    const spokoResult = await spokoGetQuote({
      sourceCurrency: senderCurrency,
      destinationCurrency: recipientCurrency,
      sourceAmount: senderAmount,
    });

    const easysendResult = easysendGetQuote(
      mapping.countryCodes[senderCountry],
      senderCurrency,
      mapping.countryCodes[recipientCountry],
      recipientCurrency,
      (senderAmount * 100).toString()
    );

    return Promise.allSettled([
      transferwiseResult,
      skrillResult,
      easysendResult,
      spokoResult,
    ]).then(([transferwise, skrill, easysend, spoko]) => {
      response.header("Content-Type", "application/json");
      response.send(
        JSON.stringify(
          {
            transferwise,
            skrill,
            easysend,
            spoko,
          },
          null,
          2
        )
      );
    });
  };
}

function Transferwise(sandbox) {
  return (senderCurrency, recipientCurrency, senderAmount) =>
    request({
      method: "post",
      sandbox,
      path: "/quotes",
      data: {
        source: senderCurrency,
        target: recipientCurrency,
        sourceAmount: senderAmount,
        rateType: "FIXED",
        type: "BALANCE_PAYOUT",
      },
    })
      .then((result) => result.data)
      .catch((error) => error);

  function request({
    method = "get",
    path = "",
    version = "v1",
    sandbox = false,
    data,
  }) {
    const requestOptions = {
      baseURL: sandbox
        ? "https://api.sandbox.transferwise.tech"
        : "https://api.transferwise.com",
      url: `/${version}${path}`,
      method,
      headers: {
        Authorization: "Bearer 3dd320ab-2fd2-4ba3-872e-34ff415ceff5",
        "Content-Type": "application/json",
      },
      ...(data && { data }),
    };

    return axios(requestOptions).catch(
      (error) =>
        new Error(
          `${error.name}:${error.message}\n${JSON.stringify(
            {
              ...requestOptions,
              ...{
                ...requestOptions.headers,
                Authorization: "Bearer <API Token>",
              },
            },
            null,
            2
          )}`
        )
    );
  }
}

async function RequestInterceptScraper(
  browser,
  url,
  triggeringSelector,
  interceptUrl
) {
  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  return async (payload) => {
    await page.setRequestInterception(true);
    const { resolve, reject, promise } = new Deferred();

    addRequestInterceptor(page, payload);
    addResponseInterceptor(page, resolve, reject);

    page.typeIfExists(
      triggeringSelector,
      Math.floor(Math.random() * 1000).toString()
    );

    return promise;
  };

  function addRequestInterceptor(target, payload) {
    target.once("request", requestInterceptor);

    function requestInterceptor(request) {
      if (
        ["image", "font", "stylesheet"].indexOf(request.resourceType()) === -1
      ) {
        if (payload && request.url().includes(interceptUrl)) {
          return request.continue({
            postData: JSON.stringify({
              ...JSON.parse(request.postData()),
              ...payload,
            }),
          });
        }
      } else {
        return request.abort();
      }

      return request.continue();
    }
  }

  function addResponseInterceptor(target, resolve, reject) {
    target.once("response", responseInterceptor);

    async function responseInterceptor(response) {
      if (
        response.url().includes(interceptUrl) &&
        typeof resolve === "function"
      ) {
        try {
          await page.setRequestInterception(false);

          const result = await response.json();
          return resolve(result);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      }
    }
  }
}

async function easysendGetQuote(
  senderCountry,
  senderCurrency,
  recipientCountry,
  recipientCurrency,
  senderAmount
) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await axios({
        baseURL: "https://www.easysend.pl/api/v2/public/offers",
        url: `/${senderCountry}/${senderCurrency}/${recipientCountry}/${recipientCurrency}/${senderAmount}`,
      });
      const formattedResult = result.data.data.attributes;

      const exchangeRate = parseFloat(
        formattedResult["exchange_rate"]["calc_rate"]
      );
      const recipientAmount = (parseInt(senderAmount) / 100) * exchangeRate;
      const recipientAmountFinal = formattedResult["transfer_types"][0].fee.map(
        (fee) => ({
          amount:
            recipientAmount -
            (parseInt(fee.value.amount) / 100) *
              (fee.value.currency === senderCurrency ? exchangeRate : 1),
          fee,
        })
      );

      return resolve({
        ...formattedResult,
        recipientAmount: recipientAmountFinal,
      });
    } catch (error) {
      console.error(error);
      return reject(error);
    }
  });
}

function Deferred() {
  let deferred = {};
  let promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return { ...deferred, promise };
}

module.exports = api;
