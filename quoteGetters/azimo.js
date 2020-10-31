"use strict";
// 0. => <SENDER_COUNTRY>, <RECIPIENT_COUNTRY>, <RECIPIENT_CURRENCY>, <SENDER_AMOUNT>
//
// 1. Request to https://azimo.com/en/rest/sendingCountryConfigs/<SENDER_COUNTRY>?payoutCountryIso3Code=<RECIPIENT_COUNTRY>
// a. If failed, throw Error<"send-receive country pair not supported">
// => JSON
//
// 2. => JSON: {
//   sendingCountryConfigs.items: [] of {
//     iso3Code: <DEFAULT SENDER_COUNTRY>,
//  	 countryIso3Code: <SENDER_CURRENCY DEFAULT>,
//  	 payoutCountryConfigs: [] of {
//  	   currencies: [] of {
//  		 	 iso3Code: <RECIPIENT_CURRENCY OPTION>,
//  		 	 deliveryMethods: [] of {
//  		 	   options.type: <RECIPIENT_METHOD OPTION>
//  		 	 }
//  		 }
//     }
//   }
// }
// => <SENDER_CURRENCY>, [] of { <RECIPIENT_CURRENCY OPTION>, [] of <RECIPIENT_METHOD OPTION> }
//
// 3. Find the <RECIPIENT_CURRENCY> we need.
// a. If not found, throw Error<"currency not supported">.
// b. If found, find currency with the <RECIPIENT_METHOD> = 'SWIFT'.
// c. If not found, return <RECIPIENT_METHOD>[0].
// d. If not found, throw ServiceError<"no transfer method available">.
// => <SENDER_CURRENCY>, <RECIPIENT_CURRENCY>, <RECIPIENT_METHOD>
//
// 4. Request to https://api.azimo.com/service-rates/v1/public/prices/current?sendingCountry=<SENDER_COUNTRY>&sendingCurrency=<SENDER_CURRENCY default>&receivingCountry=<RECIPIENT_COUNTRY>&receivingCurrency=<RECIPIENT_CURRENCY option>&deliveryMethod=<RECIPIENT_METHOD>
// a. If failed, return Error<"country, currency and delivery tuple not supported">
// => JSON
//
// 5. => JSON -> rates: [] of { rate: <EXCHANGE_RATE OPTION> }
// a. Return <EXCHANGE_RATE OPTION>[0]
// => <EXCHANGE_RATE>
//
// 6. => <SENDER_AMOUNT> * <EXCHANGE_RATE>
// => <RECIPIENT_AMOUNT>

const axios = require("axios");
const { handle, signatureHandler } = require("../util");

module.exports = async (queryConfig) => {
  const {
    senderCountry,
    recipientCountry,
    recipientCurrency,
    senderAmount,
  } = signatureHandler(queryConfig);

  console.log("AZIMO PAYLOAD:", {
    senderCountry,
    recipientCountry,
    recipientCurrency,
    senderAmount,
  });

  const configRequestOptions = {
    baseURL: "https://azimo.com/en/rest/sendingCountryConfigs",
    url: `/${senderCountry}?payoutCountryIso3Code=${recipientCountry}`,
  };

  const {
    data: {
      sendingCountryConfigs: { items: configData },
    },
    // TODO: separate function (axios + error handling)
  } = await axios(configRequestOptions).catch((error) => {
    console.log(error);
    console.log(configRequestOptions);
    // TODO: test Azimo error messages. Maybe there's a more granular message
    // possible than 'invalid country pair' (e.g. 'invalid sender/recipient country')
    throw new Error("[SENDER, RECEIVER]_TUPLE_NOT_FOUND.AZIMO");
  });

  // TODO: if (value inside, maybe check for array length?)
  const senderConfig = handle(
    configData[0],
    new Error("COUNTRY_PAIR_NOT_FOUND.AZIMO"),
    configData
  );

  // TODO: check error messages/codes
  const senderCurrency = handle(
    senderConfig["currencyIso3Code"],
    new Error("SENDER_NOT_FOUND.AZIMO"),
    senderConfig
  );

  const recipientConfig = handle(
    senderConfig["payoutCountryConfigs"][0],
    new Error("RECIPIENT_NOT_FOUND.AZIMO"),
    senderConfig
  );

  const recipientCurrencyConfig = handle(
    recipientConfig["currencies"].find(
      (currency) => currency["iso3Code"] === recipientCurrency
    ),
    new Error("RECIPIENT_NOT_FOUND.AZIMO"),
    recipientConfig
  );

  recipientCurrency = handle(
    recipientCurrencyConfig["iso3Code"],
    new Error("RECIPIENT_NOT_FOUND.AZIMO"),
    recipientCurrencyConfig
  );

  console.log("ALA BLAAAAA NUUUU", recipientCurrency);

  const deliveryMethods = handle(
    recipientCurrencyConfig["deliveryMethods"].find(
      (deliveryMethod) => deliveryMethod.type === "SWIFT"
    ) || recipientCurrencyConfig["deliveryMethods"][0],
    new Error("DELIVERY_METHOD_TO_RECIPIENT_NOT_FOUND.AZIMO"),
    recipientCurrencyConfig
  );

  console.log("y8hihuibuibiubiWF", deliveryMethods);

  const deliveryMethod = handle(
    deliveryMethods.type,
    new Error("DELIVERY_METHOD_TO_RECIPIENT_NOT_FOUND.AZIMO"),
    deliveryMethods
  );

  console.log("U(*FJWEFJ(EWFICENEIWF", deliveryMethod);

  const ratesRequestOptions = {
    baseURL: "https://api.azimo.com/service-rates/v1/public/prices",
    url: `/current?sendingCountry=${senderCountry}&sendingCurrency=${senderCurrency}&receivingCountry=${recipientCountry}&receivingCurrency=${recipientCurrency}&deliveryMethod=${deliveryMethod}`,
  };

  console.log("OIEJEWFIOWEKFIOKEWFOWEKF", ratesRequestOptions);

  const {
    data: { rates: rateData },
  } = await axios(ratesRequestOptions).catch((error) => {
    console.log(error);
    console.log(ratesRequestOptions);
    // TODO: test Azimo error messages. Maybe there's a more granular message
    // possible than 'invalid country pair' (e.g. 'invalid sender/recipient country')
    throw new Error("[SENDER, RECIPIENT, DELIVERY]_TUPLE_NOT_FOUND.AZIMO");
  });

  // TODO: sort rates by lowest instead of rateData[0]
  const exchangeRate = handle(
    rateData[0].rate,
    new Error("RATE_NOT_FOUND.AZIMO"),
    rateData
  );

  const recipientAmountFinal = parseFloat(
    (senderAmount * exchangeRate).toFixed(2)
  );

  // TODO: format result
  return {
    name: "azimo",
    result: recipientAmountFinal,
  };
};
