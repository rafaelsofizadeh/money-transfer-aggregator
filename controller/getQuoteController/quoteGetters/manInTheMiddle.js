"use strict";

import pq from "p-queue";
const PQueue = pq.default;

import { Deferred, signatureHandler } from "../../../util.js";

async function typeInInput(input, content = Math.floor(Math.random() * 1000)) {
  await input.click();
  await input.focus();
  //https://stackoverflow.com/a/52633235
  await input.click({ clickCount: 3 });
  await input.type(content.toString());
}

function createRequestInterceptor(interceptUrl, payload) {
  return function requestInterceptor(request) {
    if (!request._interceptionHandled) {
      if (
        ["image", "font", "stylesheet", "media"].includes(
          request.resourceType()
        )
      ) {
        return request.abort();
      }

      if (request.url().includes(interceptUrl)) {
        const augmentedPayload = {
          postData: JSON.stringify({
            ...JSON.parse(request.postData()),
            ...payload,
          }),
        };

        return request.continue(augmentedPayload);
      }

      return request.continue();
    }
  };
}

function createResponseInterceptor(interceptUrl, resolve, reject) {
  return async function responseInterceptor(response) {
    try {
      if (response.url().includes(interceptUrl)) {
        const result = await response.json();

        if (response.status() >= 299) {
          return reject({ message: JSON.stringify(result) });
        }
        return resolve(result);
      }
    } catch (error) {
      const message = "Scraped website not responding";
      console.log(`[manInTheMiddle] Error: ${message}`);
      return reject(message);
    }
  };
}

export default async (
  browser,
  signatureMap,
  countryCodeType,
  currencyCodeType,
  url,
  inputSelector,
  interceptUrl,
  formatter,
  reloadPageCondition
) => {
  const queue = new PQueue({ concurrency: 1 });
  const page = await browser.newPage();

  await page.setDefaultNavigationTimeout(0);
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.setRequestInterception(true);

  let input = null;

  while (input === null) {
    input = await page.$(inputSelector);
  }

  return (query) => queue.add(() => getQuote(query));

  async function getQuote(query) {
    const payload = signatureHandler(
      query,
      signatureMap,
      countryCodeType,
      currencyCodeType
    );

    const requestInterceptor = createRequestInterceptor(interceptUrl, payload);
    const { resolve, reject, promise: response } = new Deferred();
    const responseInterceptor = createResponseInterceptor(
      interceptUrl,
      resolve,
      reject
    );

    page.on("request", requestInterceptor);
    page.on("response", responseInterceptor);

    await typeInInput(input);

    const result = await response.finally(
      async () => await page.removeAllListeners()
    );

    /*if (
      typeof reloadPageCondition === "function" &&
      reloadPageCondition(result)
    ) {
      console.log("page reload");
      page.reload({ waitUntil: "networkidle0" });
    }*/

    return formatter(result);
  }
};
