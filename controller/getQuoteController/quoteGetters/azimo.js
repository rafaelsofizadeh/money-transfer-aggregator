"use strict";

import axios from "axios";
import { signatureHandler } from "../../../util.js";

export default async (query) => {
  const {
    senderCountry,
    recipientCountry,
    recipientCurrency,
    senderAmount,
  } = signatureHandler(query);

  const configRequestUrl = `https://azimo.com/en/rest/sendingCountryConfigs/${senderCountry}?payoutCountryIso3Code=${recipientCountry}`;

  const {
    data: {
      sendingCountryConfigs: {
        items: [
          {
            currencyIso3Code: senderCurrency,
            payoutCountryConfigs: [{ currencies: recipientCurrenciesConfig }],
          },
        ],
      },
    },
  } = await axios.get(configRequestUrl).catch((error) => {
    console.log("[azimo][axios] Config request error:", error);
    // TODO: test Azimo error messages. Maybe there's a more granular message
    // possible than 'invalid country pair' (e.g. 'invalid sender/recipient country')
    throw new Error("Sender-recipient pair not supported");
  });

  const {
    iso3Code: finalRecipientCurrency,
    deliveryMethods,
  } = recipientCurrenciesConfig.find(
    (currency) => currency.iso3Code === recipientCurrency
  );

  const { type: deliveryMethod } =
    deliveryMethods.find((deliveryMethod) => deliveryMethod.type === "SWIFT") ||
    deliveryMethods[0];

  const quoteRequestUrl = `https://api.azimo.com/service-rates/v1/public/prices/current?sendingCountry=${senderCountry}&sendingCurrency=${senderCurrency}&receivingCountry=${recipientCountry}&receivingCurrency=${finalRecipientCurrency}&deliveryMethod=${deliveryMethod}`;

  const {
    data: {
      rates: [{ rate: exchangeRate }],
    },
  } = await axios.get(quoteRequestUrl).catch((error) => {
    console.log("[azimo][axios] Quote request error:", error);
    throw new Error(
      "Sender-recipient-delivery method combination not supported"
    );
  });

  return parseFloat((senderAmount * exchangeRate).toFixed(2));
};
