"use strict";

const { Deferred, signatureHandler } = require("../util");

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
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.setRequestInterception(true);

  return async (queryConfig) => {
    const payload = signatureHandler(
      queryConfig,
      signatureMap,
      countryCodeType,
      currencyCodeType
    );

    console.log(`${name.toUppercase()} PAYLOAD:`, payload);

    console.log(`${name} #${counter++}`);

    const requestInterceptor = addRequestInterceptor(payload);
    page.on("request", requestInterceptor);
    console.log(`${name} #${counter++} request interceptor: added`);

    //const promise = addResponseInterceptor(page);
    const { resolve, reject, promise } = new Deferred();
    const responseInterceptor = addResponseInterceptor(resolve, reject);

    page.on("response", responseInterceptor);
    console.log(`${name} #${counter++}: response interceptor: added`);
    promise.finally(() => {
      page.removeListener("request", requestInterceptor);
      page.removeListener("response", responseInterceptor);
      console.log(`${name} #${counter++}: interceptors: removed`);
    });

    await typeInInput();

    return promise;
  };

  async function typeInInput(content = Math.floor(Math.random() * 1000)) {
    //https://stackoverflow.com/a/52633235
    const input = await page.$(inputSelector);
    console.log(`${name} #${counter++}: input selector found`);
    await input.click({ clickCount: 3 });
    console.log(`${name} #${counter++}: input selector clicked`);
    await input.type(content.toString());
    console.log(`${name} #${counter++}: input typed`);
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
        /*console.log(
          `${name}: request interceptor #~: intercepted`,
          request.url(),
          interceptUrl,
          payload
        );*/

        console.log(
          `${name} #${counter++}: request interceptor: ${request.url()}`
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
          const result = await response.json();
          // TODO: format result, i.e. add a formatting function as a parameter
          return resolve({ name, result });
        }
      } catch (error) {
        console.log(error);
        return reject(new Error(`SERVICE_ERROR.${name.toUppercase()}`));
      }
    };
  }
};
