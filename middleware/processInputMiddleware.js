// Currencies
import cuc from "currency-codes";
// Countries
import coc from "country-code-lookup";

export default (request, response, next) => {
  const argumentsCarrier = request.body;

  if (!Object.keys(argumentsCarrier).length) {
    const message = "Query must not be empty.";
    console.log(`[processInputMiddleware] Error: ${message}`);
    return next(message);
  }

  const {
    senderCurrency,
    senderCountry,
    recipientCurrency,
    recipientCountry,
    senderAmount,
  } = argumentsCarrier;

  if (
    !senderCurrency ||
    !senderCountry ||
    !recipientCurrency ||
    !recipientCountry
  ) {
    response.status(400);

    const message =
      "Incomplete request body. Payload should include [senderCurrency, senderCountry, recipientCurrency, recipientCountry].";
    console.log(`[processInputMiddleware] Error: ${message}`);
    return next(message);
  }

  if (isNaN(senderAmount)) {
    response.status(400);

    const message = "Amount should be a float number.";
    console.log(`[processInputMiddleware] Error: ${message}`);
    return next(message);
  }

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

    const message = "Please enter a valid ISO 3166-1 alpha-3 country code.";
    console.log(`[processInputMiddleware] Error: ${message}`);
    return next(message);
  }

  if (!senderCurrencyObj || !recipientCurrencyObj) {
    response.status(400);

    const message = "Please enter a valid ISO 4217 currency code.";
    console.log(`[processInputMiddleware] Error: ${message}`);
    return next(message);
  }

  const parsedAmount = parseFloat(parseFloat(senderAmount).toFixed(2));

  response.locals.query = {
    senderCurrency: senderCurrencyObj,
    senderCountry: senderCountryObj,
    recipientCurrency: recipientCurrencyObj,
    recipientCountry: recipientCountryObj,
    senderAmount: parsedAmount,
  };

  return next();
};
