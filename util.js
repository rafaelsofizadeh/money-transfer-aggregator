import { serializeError } from "serialize-error";

export function Deferred() {
  let deferred = {};
  let promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return { ...deferred, promise };
}

// TODO: QuoteGetterError object
// TODO: Error trace
export function createHandler(name) {
  return function handle(value, log, error, errorLog) {
    if (
      (isNaN(value) && !value) ||
      (Array.isArray(value) && value.length === 0)
    ) {
      console.log(errorLog);
      console.log(error);
      throw error;
    }

    console.log(`[util][${name}][handle] ${log}:`, value);

    return value;
  };
}

export function signatureHandler(
  query,
  signatureMap = {
    senderCountry: "senderCountry",
    senderCurrency: "senderCurrency",
    recipientCountry: "recipientCountry",
    recipientCurrency: "recipientCurrency",
    senderAmount: "senderAmount",
  },
  countryCodeType = "iso3",
  currencyCodeType = "code"
) {
  const newEntries = Object.entries(signatureMap).map(
    ([sourceKey, targetKey]) => {
      const sourceValue = query[sourceKey];

      if (sourceValue === null) return;

      return [
        targetKey,
        typeof sourceValue === "object"
          ? sourceValue[
              sourceKey.endsWith("Country")
                ? countryCodeType
                : sourceKey.endsWith("Currency")
                ? currencyCodeType
                : {}
            ]
          : sourceValue,
      ];
    }
  );

  return Object.fromEntries(newEntries);
}

export function iso2to3() {
  fs.writeFileSync(
    path.join(__dirname, "/public/data/iso3-2.json"),
    JSON.stringify(
      Object.fromEntries(
        Object.entries(
          JSON.parse(
            fs
              .readFileSync(path.join(__dirname, "/public/data/iso2-3.json"))
              .toString()
          )
        ).map(([key, value]) => [value, key])
      )
    )
  );
}

export function formatResult(name, fn) {
  return {
    name,
    result: fn(),
  };
}

export function timeout(promise, duration) {
  return Promise.race([promise, timeoutFn()]);

  function timeoutFn() {
    return new Promise((_, reject) => {
      const timeoutId = setTimeout(() => {
        clearTimeout(timeoutId);
        return reject(new Error("Deferred promise timed out"));
      }, duration);
    });
  }
}

export function standardHandle(promise, name) {
  return promise
    .then((result) => ({ status: "success", result }))
    .catch((error) => ({ status: "failure", reason: error.message }))
    .then((finalResult) => ({ name, ...finalResult }));
}
