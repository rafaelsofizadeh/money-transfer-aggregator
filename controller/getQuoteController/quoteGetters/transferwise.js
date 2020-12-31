"use strict";

import axios from "axios";

import { signatureHandler } from "../../../util.js";

export default async (query, sandbox = true) => {
  const { senderCurrency, recipientCurrency, senderAmount } = signatureHandler(
    query
  );

  const requestOptions = {
    baseURL: sandbox
      ? "https://api.sandbox.transferwise.tech"
      : "https://api.transferwise.com",
    url: `/v1/quotes`,
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

  const {
    data: { targetAmount: finalAmount },
  } = await axios.post(requestOptions).catch((error) => {
    console.log("[transferwise][axios] Error:", error);
    throw new Error("Request error");
  });

  return finalAmount;
};
