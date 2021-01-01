import azimoGetQuote from "./quoteGetters/azimo.js";
import transferwiseGetQuote from "./quoteGetters/transferwise.js";
import easysendGetQuote from "./quoteGetters/easysend.js";

import spokoConstructor from "./quoteGetters/spoko.js";
import skrillConstructor from "./quoteGetters/skrill.js";

import { standardHandle, timeout } from "../../util.js";

export default async (browser) => {
  const spokoGetQuote = await spokoConstructor(browser);
  const skrillGetQuote = await skrillConstructor(browser);

  const quoteGetters = [
    { quoteGetter: azimoGetQuote, name: "azimo" },
    { quoteGetter: transferwiseGetQuote, name: "transferwise" },
    { quoteGetter: easysendGetQuote, name: "easysend" },
    { quoteGetter: spokoGetQuote, name: "spoko" },
    { quoteGetter: skrillGetQuote, name: "skrill" },
  ];

  return async (request, response) => {
    const { query } = response.locals;

    try {
      const quotes = await Promise.all(
        quoteGetters.map(({ quoteGetter, name }) =>
          standardHandle(quoteGetter(query), name)
        )
      );

      return response.json(quotes);
    } catch (error) {
      return console.log("[getQuoteController] Unexpected error:", error);
    }
  };
};
