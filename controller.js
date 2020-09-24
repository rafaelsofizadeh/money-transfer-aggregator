const mapping = require("./config.json")["mapping"];

module.exports = ({
  transferwiseGetQuote,
  skrillGetQuote,
  spokoGetQuote,
  easysendGetQuote,
}) => async (request, response) => {
  const {
    senderCurrency,
    senderCountry,
    recipientCurrency,
    recipientCountry,
    senderAmount,
  } = request.query;

  if (
    !mapping.countryCodes[senderCountry] ||
    !mapping.countryCodes[recipientCountry]
  ) {
    response.status(400);
    return response.json({
      error: "Please enter a valid ISO 3166-1 alpha-3 country code.",
    });
  }

  if (
    mapping.currencyCodes.indexOf(senderCurrency) < 0 ||
    !mapping.currencyCodes.indexOf(recipientCurrency) < 0
  ) {
    response.status(400);
    return response.json({
      error: "Please enter a valid currency code.",
    });
  }

  const transferwiseResult = transferwiseGetQuote(
    senderCurrency,
    recipientCurrency,
    senderAmount
  );

  const skrillResult = await skrillGetQuote({
    senderCurrency,
    senderCountry,
    recipientCurrency,
    recipientCountry,
    senderAmount,
  });

  const spokoResult = await spokoGetQuote({
    sourceCurrency: senderCurrency,
    destinationCurrency: recipientCurrency,
    sourceAmount: senderAmount,
  });

  const easysendResult = easysendGetQuote(
    mapping.countryCodes[senderCountry],
    senderCurrency,
    mapping.countryCodes[recipientCountry],
    recipientCurrency,
    (senderAmount * 100).toString()
  );

  return Promise.allSettled([
    transferwiseResult,
    skrillResult,
    easysendResult,
    spokoResult,
  ]).then(([transferwise, skrill, easysend, spoko]) => {
    response.header("Content-Type", "application/json");
    response.send(
      JSON.stringify(
        {
          transferwise,
          skrill,
          easysend,
          spoko,
        },
        null,
        2
      )
    );
  });
};
