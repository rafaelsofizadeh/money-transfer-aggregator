import React from "react";

import Card from "./Card";

import { chunk } from "../util";

import "../css/card.scss";

const cardDetails = {
  transferwise: {
    name: "TransferWise",
    logoFileName: "transferwiseLogo.png",
    hue: 196,
    bonus: { exists: true, sponsor: "PayMentor.Club" },
    description: [
      "первый перевод для новых клиентов c учетом денежного бонуса",
      "три первых перевода без комиссии",
    ],
  },
  easysend: {
    name: "EasySend",
    logoFileName: "easysendLogo.svg",
    hue: 207,
    bonus: { exists: true, sponsor: "PayMentor.Club" },
    description: ["первый перевод без комиссии."],
  },
  spoko: {
    name: "Spoko",
    logoFileName: "spokoLogo.svg",
    hue: 48,
    bonus: { exists: false },
    description: ["первый перевод без комиссии."],
  },
  skrill: {
    name: "Skrill",
    logoFileName: "skrillLogo.png",
    hue: 298,
    bonus: { exists: true, sponsor: "PayMentor.Club" },
    description: [
      "первый перевод для новых клиентов с учетом денежного бонуса",
    ],
  },
  azimo: {
    name: "Azimo",
    logoFileName: "azimoLogo.svg",
    hue: 176,
    bonus: { exists: true, sponsor: "Azimo" },
    description: [
      "первый перевод для новых клиентов c учетом денежного бонуса.",
      "два первых перевода без комиссии.",
    ],
  },
};

const Cards = ({ data: { request, response: quotes } }) => {
  if (!Array.isArray(quotes)) {
    return false;
  }

  const successfulQuotes = quotes.filter((quote) => quote.status === "success");

  if (successfulQuotes.length) {
    successfulQuotes.sort(({ result: amountA }, { result: amountB }) =>
      parseFloat(amountA) > parseFloat(amountB) ? -1 : 1
    );
    const quotesChunkedToRows = chunk(successfulQuotes, 3);

    const bestQuote = successfulQuotes[0];
    const { name: bestQuoteNameOfficial } = cardDetails[bestQuote.name];
    const bestQuoteDetails = {
      ...bestQuote,
      officialName: bestQuoteNameOfficial,
    };

    return (
      <div className="cards">
        {quotesChunkedToRows.map((chunk, index) => (
          <div key={`chunk-${index}`} className="cards-row">
            {chunk.map(({ name, result: amount }) => (
              <Card
                key={name}
                quoteRequest={request}
                quote={{ serviceName: name, amount }}
                details={{
                  ...cardDetails[name],
                  isTopQuote: index === 0,
                  ...(index === 0 && { bestQuote: bestQuoteDetails }),
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default Cards;
