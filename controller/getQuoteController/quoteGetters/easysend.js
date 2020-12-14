"use strict";

const axios = require("axios");
const { createHandler, signatureHandler } = require("../../../util");

// 0. => <SENDER_COUNTRY>, <SENDER_CURRENCY>, <RECIPIENT_COUNTRY>, <RECIPIENT_CURRENCY>, <SENDER_AMOUNT>
//
// 1. <RECIPIENT_COUNTRY>, <SENDER_COUNTRY> iso3 => iso2
//
// 2. <SENDER_AMOUNT> * 100 -> to string; example: 103.45 -> 10345 -> "10345"
// => <FORMATTED SENDER_AMOUNT>
//
// 3. Request to https://www.easysend.pl/api/v2/public/offers/<SENDER_COUNTRY>/<SENDER_CURRENCY>/<RECIPIENT_COUNTRY>/<RECIPIENT_CURRENCY>/<FORMATTED SENDER_AMOUNT>
// a. If failed, return Error<"country, currency and delivery tuple not supported">
// => JSON
//
// 4. => JSON: {
//   data.attributes {
//     exchange_rate: {
//       calc_rate: <EXCHANGE_RATE>,
//       default_transfer_type: <TRANSFER_TYPE DEFAULT>,
//       transfer_types: [] of {
//         name: <TRANSFER_TYPE OPTION>,
//         fee: [] of {
//           type: <SECONDARY_TRANSFER_TYPE OPTION>,
//           value: {
//             amount: <FEE_AMOUNT>,
//             currency: <FEE_CURRENCY>
//           }
//         }
//       }
//     }
//   }
// }
// => <EXCHANGE_RATE>, <TRANSFER_TYPE DEFAULT>, [] of { <TRANSFER_TYPE OPTION>, [] of { <SECONDARY_TRANSFER_TYPE OPTION>, <FEE_AMOUNT>, <FEE_CURRENCY> } }
//
// 5. Find the <TRANSFER_TYPE OPTION> = <TRANSFER_TYPE DEFAULT>
// a. If not found, return <TRANSFER_TYPE OPTION>[0]
// b. If not found, throw ServiceError<"no transfer options available">
// => <TRANSFER_TYPE>, [] of { <SECONDARY_TRANSFER_TYPE OPTION>, <FEE_AMOUNT>, <FEE_CURRENCY> }
//
// 6. Find the <SECONDARY_TRANSFER_TYPE OPTION> with the lowest <FEE_AMOUNT>
// => <SECONDARY_TRANSFER_TYPE>, <FEE_AMOUNT>, <FEE_CURRENCY>
//
// 7. (<SENDER_AMOUNT> - (if <FEE_AMOUNT> is <SENDER_CURRENCY>)) * <EXCHANGE_RATE> - (if <FEE_AMOUNT> is <RECIPIENT_CURRENCY>)
// => <RECIPIENT_AMOUNT>
module.exports = async (queryConfig) => {
  const handle = createHandler("easysend");

  const {
    senderCountry,
    senderCurrency,
    recipientCountry,
    recipientCurrency,
    senderAmount,
  } = signatureHandler(queryConfig, undefined, "iso2");

  console.log("EASYSEND PAYLOAD:", {
    senderCountry,
    senderCurrency,
    recipientCountry,
    recipientCurrency,
    senderAmount,
  });

  const formattedSenderAmount = (senderAmount * 100).toString();
  const requestOptions = {
    baseURL: "https://www.easysend.pl/api/v2/public/offers",
    url: `/${senderCountry}/${senderCurrency}/${recipientCountry}/${recipientCurrency}/${formattedSenderAmount}`,
  };

  const {
    data: {
      data: { attributes: result },
    },
  } = await axios(requestOptions).catch((error) => {
    console.log(error);
    console.log(requestOptions);
    // TODO: test Azimo error messages. Maybe there's a more granular message
    // possible than 'invalid country pair' (e.g. 'invalid sender/recipient country')
    throw error; //new Error("[SENDER, RECIPIENT, AMOUNT]_TUPLE_NOT_FOUND.EASYSEND");
  });

  const transferTypes = handle(
    result["transfer_types"],
    "Transfer types:",
    new Error("DELIVERY_METHOD_TO_RECIPIENT_NOT_FOUND.EASYSEND"),
    result
  );

  const defaultTransferType = result["default_transfer_type"];
  const foundDefaultTransferType = transferTypes.find(
    (transferType) => transferType.name === defaultTransferType
  );
  const transferType = handle(
    foundDefaultTransferType || transferTypes[0],
    "Chosen transfer type:",
    new Error("DELIVERY_METHOD_TO_RECIPIENT_NOT_FOUND.EASYSEND"),
    result
  );

  const exchangeRate = handle(
    parseFloat(result["exchange_rate"]?.["calc_rate"]),
    "Exchange rate:",
    new Error("RATE_NOT_FOUND.EASYSEND"),
    result
  );

  const recipientAmount = senderAmount * exchangeRate;

  // TODO: sort fees by lowest instead of fee[0]
  const fee = transferType.fee[0];
  // DETERMINE: Error code
  const feeAmount = handle(
    fee.value.amount,
    "Fee amount:",
    new Error("SERVICE_ERROR.EASYSEND"),
    fee
  );

  const recipientAmountFinal = parseFloat(
    (
      recipientAmount -
      (parseInt(feeAmount) / 100) *
        (fee.value.currency === senderCurrency ? exchangeRate : 1)
    ).toFixed(2)
  );

  return {
    name: "easysend",
    result: recipientAmountFinal,
  };
};
