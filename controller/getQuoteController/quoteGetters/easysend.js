"use strict";

import axios from "axios";

import { createHandler, signatureHandler } from "../../../util.js";

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
export default async (query) => {
  const {
    senderCountry,
    senderCurrency,
    recipientCountry,
    recipientCurrency,
    senderAmount,
  } = signatureHandler(query, undefined, "iso2");

  const formattedSenderAmount = (senderAmount * 100).toString();

  const {
    data: {
      data: {
        attributes: {
          transfer_types: transferTypes,
          default_transfer_type: defaultTransferType,
          exchange_rate: { calc_rate: exchangeRate },
        },
      },
    },
  } = await axios
    .get(
      `https://www.easysend.pl/api/v2/public/offers/${senderCountry}/${senderCurrency}/${recipientCountry}/${recipientCurrency}/${formattedSenderAmount}`
    )
    .catch((error) => {
      console.log("[easysend][axios] Request error:", error);
      // TODO: test Easysend error messages. Maybe there's a more granular message
      // possible than 'invalid country pair' (e.g. 'invalid sender/recipient country')
      throw new Error(
        "Sender-recipient-amount method combination not supported"
      );
    });

  const {
    // TODO: sort fees by lowest instead of fee[0]
    fee: [
      {
        value: { amount: feeAmount, currency: feeCurrency },
      },
    ],
  } =
    transferTypes.find(
      (transferType) => transferType.name === defaultTransferType
    ) || transferTypes[0];

  const recipientAmount = senderAmount * exchangeRate;

  const recipientAmountFinal = parseFloat(
    (
      recipientAmount -
      (parseInt(feeAmount) / 100) *
        (feeCurrency === senderCurrency ? exchangeRate : 1)
    ).toFixed(2)
  );

  return recipientAmountFinal;
};
