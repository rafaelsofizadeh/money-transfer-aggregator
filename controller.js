module.exports = ({
  transferwiseGetQuote,
  skrillGetQuote,
  spokoGetQuote,
  easysendGetQuote,
  azimoGetQuote,
}) => async (request, response) => {
  const { queryConfig } = response.locals;

  // DETERMINE / TODO: Does .allSettled collect rejected promises, too?
  // What to do with rejected promises?
  return Promise.allSettled([
    transferwiseGetQuote(queryConfig),
    skrillGetQuote(queryConfig),
    easysendGetQuote(queryConfig),
    spokoGetQuote(queryConfig),
    azimoGetQuote(queryConfig),
  ]).then(([transferwise, skrill, easysend, spoko, azimo]) => {
    // TODO: Errors only shown for transferwise
    const result = { transferwise, skrill, easysend, spoko, azimo };
    console.log(JSON.stringify(result, null, 2));

    return response
      .type("json")
      .send(
        JSON.stringify(
          { transferwise, skrill, easysend, spoko, azimo },
          null,
          2
        )
      );
  });
};
