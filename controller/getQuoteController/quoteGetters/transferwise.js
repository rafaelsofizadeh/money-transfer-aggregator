"use strict";
const axios = require("axios");
const { signatureHandler } = require("../../../util");

module.exports = async (queryConfig, sandbox = true) => {
  const { senderCurrency, recipientCurrency, senderAmount } = signatureHandler(
    queryConfig
  );

  console.log("[transferwise] Payload:", {
    senderCurrency,
    recipientCurrency,
    senderAmount,
  });

  const requestOptions = {
    baseURL: sandbox
      ? "https://api.sandbox.transferwise.tech"
      : "https://api.transferwise.com",
    url: `/v1/quotes`,
    method: "post",
    headers: {
      Authorization: "Bearer 3dd320ab-2fd2-4ba3-872e-34ff415ceff5",
      "Content-Type": "application/json",
    },
    data: {
      source: senderCurrency,
      target: recipientCurrency,
      sourceAmount: senderAmount,
      rateType: "FIXED",
      type: "BALANCE_PAYOUT",
    },
  };

  // DETERMINE / TODO: How to reject a promise here (in an async/await function)? Does throwing an error cause a promise rejection?
  const { data: result } = await axios(requestOptions).catch((error) => {
    console.log("[transferwise] Error:", error);
    console.log("[transferwise] Request options:", requestOptions);
    throw error;
  });

  // TODO: format result
  return { name: "transferwise", result };
};
