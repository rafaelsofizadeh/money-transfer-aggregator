import azimoGetQuote from "./quoteGetters/azimo.js";
import transferwiseGetQuote from "./quoteGetters/transferwise.js";
import easysendGetQuote from "./quoteGetters/easysend.js";

import spokoConstructor from "./quoteGetters/spoko.js";
import skrillConstructor from "./quoteGetters/skrill.js";

import { standardHandle } from "../../util.js";

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
        quoteGetters.map(({ quoteGetter, name }) => {
          const result = quoteGetter(query);
          const formattedTimedResult = standardHandle(result, name);

          return formattedTimedResult;
          // standardHandle(timeout(quoteGetter(query), 5000), name);
        })
      );

      return response.json(quotes);
    } catch (error) {
      return console.log("[getQuoteController] Unexpected error:", error);
    }
  };
};
