const { Deferred } = require("../util");

module.exports = async (browser, url, inputSelector, interceptUrl) => {
  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  return async (payload) => {
    await page.setRequestInterception(true);
    const { resolve, reject, promise } = new Deferred();

    addRequestInterceptor(page, payload);
    addResponseInterceptor(page, resolve, reject);

    await page.screenshot({ path: "anon.png" });

    //https://stackoverflow.com/a/52633235
    const input = await page.$(inputSelector);
    await input.click({ clickCount: 3 });
    await input.type(Math.floor(Math.random() * 1000).toString());

    await page.screenshot({ path: "aton.png" });

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
};
