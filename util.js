// LEARN: ES6 module system vs CommonJS
function Deferred() {
  let deferred = {};
  let promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return { ...deferred, promise };
}

// TODO: QuoteGetterError object
// TODO: Error trace
function createHandler(name) {
  return function handle(value, log, error, errorLog) {
    if (
      (isNaN(value) && !value) ||
      (Array.isArray(value) && value.length === 0)
    ) {
      //if (title) console.log(`${title.toUppercase()} LOG:`);
      console.log(errorLog);
      console.log(error);
      throw error;
    }

    console.log(`[util][${name}][handle] ${log}:`, value);

    return value;
  };
}

function signatureHandler(
  queryConfig,
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
      const sourceValue = queryConfig[sourceKey];

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

function iso2to3() {
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

module.exports = {
  Deferred,
  createHandler,
  signatureHandler,
};
