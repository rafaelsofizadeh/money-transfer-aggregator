// Currencies
const cuc = require("currency-codes");
// Countries
const coc = require("country-code-lookup");

module.exports = (request, response, next) => {
  const argumentsCarrier = request.body;

  if (!Object.keys(argumentsCarrier).length) {
    return next(new Error("Query must not be empty."));
  }

  const {
    senderCurrency,
    senderCountry,
    recipientCurrency,
    recipientCountry,
    senderAmount,
  } = argumentsCarrier;

  console.log("[processInput] Input query:", argumentsCarrier);

  const [
    senderCurrencyObj,
    senderCountryObj,
    recipientCurrencyObj,
    recipientCountryObj,
  ] = [
    cuc.code(senderCurrency),
    coc.byIso(senderCountry),
    cuc.code(recipientCurrency),
    coc.byIso(recipientCountry),
  ];

  if (!senderCountryObj || !recipientCountryObj) {
    response.status(400);
    return next(
      new TypeError("Please enter a valid ISO 3166-1 alpha-3 country code.")
    );
  }

  if (!senderCurrencyObj || !recipientCurrencyObj) {
    response.status(400);
    return next(new TypeError("Please enter a valid ISO 4217 currency code."));
  }

  if (isNaN(senderAmount)) {
    response.status(400);
    return next(new TypeError("Amount should be a float number."));
  }

  const parsedAmount = parseFloat(parseFloat(senderAmount).toFixed(2));

  response.locals.queryConfig = {
    senderCurrency: senderCurrencyObj,
    senderCountry: senderCountryObj,
    recipientCurrency: recipientCurrencyObj,
    recipientCountry: recipientCountryObj,
    senderAmount: parsedAmount,
  };

  console.log("[processInput] Output query:", response.locals.queryConfig);

  return next();
};
