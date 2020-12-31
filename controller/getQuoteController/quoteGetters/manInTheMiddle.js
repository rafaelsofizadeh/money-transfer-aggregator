"use strict";

import { Deferred, signatureHandler } from "../../../util.js";

async function typeInInput(input, content = Math.floor(Math.random() * 1000)) {
  await input.click({ clickCount: 3 });
  await input.type(content.toString());
}

function createRequestInterceptor(interceptUrl, payload) {
  return function requestInterceptor(request) {
    // https://github.com/puppeteer/puppeteer/blob/v1.14.0/docs/api.md#requestresourcetype
    if (
      ["image", "font", "stylesheet", "media"].includes(request.resourceType())
    ) {
      return request.abort();
    }

    if (!request._interceptionHandled) {
      if (request.url().includes(interceptUrl) && payload) {
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
        // TODO: format result, i.e. add a formatting function as a parameter
        return resolve(result);
      }
    } catch (error) {
      return reject(new Error("Response interceptor error"));
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
  interceptUrl
) => {
  const page = await browser.newPage();

  await page.setDefaultNavigationTimeout(0);
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.setRequestInterception(true);
  await page.screenshot({ path: "page-input.png" });

  //https://stackoverflow.com/a/52633235
  let input = null;

  while (input === null) {
    input = await page.$(inputSelector);
  }

  await input.screenshot({ path: "input.png" });

  return async (query) => {
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

    return response;
  };
};
