"use strict";

import { signatureHandler } from "../../../util.js";

async function typeInInput(input, content = Math.floor(Math.random() * 1000)) {
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

  let input = null;

  while (input === null) {
    input = await page.$(inputSelector);
  }

  return async (query) => {
    const payload = signatureHandler(
      query,
      signatureMap,
      countryCodeType,
      currencyCodeType
    );

    const requestInterceptor = createRequestInterceptor(interceptUrl, payload);
    page.on("request", requestInterceptor);

    await typeInInput(input);

    const response = await page.waitForResponse(
      (response) => response.url().includes(interceptUrl),
      { timeout: 5000 }
    );

    return response.json();
  };
};
