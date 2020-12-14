const { response } = require("express");

module.exports = (request, response) =>
  response.type("json").send(
    JSON.stringify(
      {
        transferwise: {
          status: "fulfilled",
          value: {
            name: "transferwise",
            result: {
              id: 4808829,
              source: "PLN",
              target: "EUR",
              sourceAmount: 1000,
              targetAmount: 223.38,
              type: "BALANCE_PAYOUT",
              rate: 0.224897,
              createdTime: "2020-12-13T11:38:57.497Z",
              createdByUserId: 5546751,
              profile: 16026861,
              rateType: "FIXED",
              deliveryEstimate: "2020-12-14T10:15:00.000Z",
              fee: 6.74,
              feeDetails: {
                transferwise: 6.74,
                payIn: 0,
                discount: 0,
                priceSetId: 134,
                partner: 0,
              },
              allowedProfileTypes: ["PERSONAL", "BUSINESS"],
              guaranteedTargetAmount: false,
              ofSourceAmount: true,
            },
          },
        },
        skrill: {
          status: "rejected",
          reason: {},
        },
        easysend: {
          status: "fulfilled",
          value: {
            name: "easysend",
            result: 221.2,
          },
        },
        spoko: {
          status: "fulfilled",
          value: {
            name: "spoko",
            result: {
              status: 0,
              msg: "success",
              sourceAmount: {
                currencyCode: "PLN",
                amount: 1000,
                commission: 0,
                totalAmount: 1000,
                minAmount: 5,
                maxAmount: 2219,
              },
              destinationAmount: {
                currencyCode: "EUR",
                rateValue: 0.2183,
                invRateValue: 4.5809,
                amount: 218.3,
                commission: 0,
                totalAmount: 218,
                minAmount: 1,
                maxAmount: 4300,
              },
              calcId: "1969358f-5144-4a84-9283-b77edfd19fac",
            },
          },
        },
        azimo: {
          status: "fulfilled",
          value: {
            name: "azimo",
            result: 222.26,
          },
        },
      },
      null,
      2
    )
  );
