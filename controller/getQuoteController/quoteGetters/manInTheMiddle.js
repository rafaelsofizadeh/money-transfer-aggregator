"use strict";

const { Deferred, signatureHandler } = require("../../../util");

module.exports = async function (
  name,
  browser,
  signatureMap,
  countryCodeType,
  currencyCodeType,
  url,
  inputSelector,
  interceptUrl
) {
  let counter = 0;

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  console.log(`[mitm][${name}][${counter++}] Default nav. timeout set to 0.`);
  console.log(`[mitm][${name}][${counter++}] Goto ${url}`);
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.setRequestInterception(true);
  console.log(
    `[mitm][${name}][${counter++}] Request interception set to true.`
  );

  return async (queryConfig) => {
    const payload = signatureHandler(
      queryConfig,
      signatureMap,
      countryCodeType,
      currencyCodeType
    );

    console.log(`[mitm][${name}][${counter++}] Payload:`, payload);

    const requestInterceptor = addRequestInterceptor(payload);
    page.on("request", requestInterceptor);
    console.log(`[mitm][${name}][${counter++}][req] Added listener.`);

    const { resolve, reject, promise } = new Deferred();
    const responseInterceptor = addResponseInterceptor(resolve, reject);

    page.on("response", responseInterceptor);
    console.log(`${name} #${counter++}: response interceptor: added`);

    promise.finally(() => {
      page.removeListener("request", requestInterceptor);
      console.log(`[mitm][${name}][${counter++}][req] Removed listener.`);

      page.removeListener("response", responseInterceptor);
      console.log(`[mitm][${name}][${counter++}][res] Removed listener.`);
    });

    await typeInInput();

    return promise;
  };

  async function typeInInput(content = Math.floor(Math.random() * 1000)) {
    //https://stackoverflow.com/a/52633235
    const input = await page.$(inputSelector);
    console.log(
      `[mitm][${name}][${counter++}][typeInInput] Input selector found.`
    );

    await input.click({ clickCount: 3 });
    console.log(
      `[mitm][${name}][${counter++}][typeInInput] Input selector clicked 3 times.`
    );

    await input.type(content.toString());
    console.log(
      `[mitm][${name}][${counter++}][typeInInput] Content typed in.`,
      content.toString()
    );
  }

  function addRequestInterceptor(payload) {
    return function requestInterceptor(request) {
      // https://github.com/puppeteer/puppeteer/blob/v1.14.0/docs/api.md#requestresourcetype
      if (
        ["image", "font", "stylesheet", "media"].includes(
          request.resourceType()
        )
      ) {
        return request.abort();
      }

      if (request.url().includes(interceptUrl) && payload) {
        console.log(
          `[mitm][${name}][${counter++}][req][interceptor] URL ${interceptUrl} intercepted:`,
          request.url()
        );

        return request.continue({
          postData: JSON.stringify({
            ...JSON.parse(request.postData()),
            ...payload,
          }),
        });
      }

      return request.continue();
    };
  }

  function addResponseInterceptor(resolve, reject) {
    return async function responseInterceptor(response) {
      try {
        if (response.url().includes(interceptUrl)) {
          console.log(
            `[mitm][${name}][${counter++}][res][interceptor] URL ${interceptUrl} intercepted:`,
            response.url()
          );

          const result = await response.json();
          console.log(
            `[mitm][${name}][${counter++}][res][interceptor] Result:`,
            result
          );
          // TODO: format result, i.e. add a formatting function as a parameter
          return resolve({ name, result });
        }
      } catch (error) {
        console.log(
          `[mitm][${name}][${counter++}][res][interceptor] Error:`,
          error
        );
        return reject(new Error(`SERVICE_ERROR.${name.toUppercase()}`));
      }
    };
  }
};
