const axios = require("axios");

module.exports = (sandbox) => {
  return (senderCurrency, recipientCurrency, senderAmount) =>
    request({
      method: "post",
      sandbox,
      path: "/quotes",
      data: {
        source: senderCurrency,
        target: recipientCurrency,
        sourceAmount: senderAmount,
        rateType: "FIXED",
        type: "BALANCE_PAYOUT",
      },
    })
      .then((result) => result.data)
      .catch((error) => error);

  function request({
    method = "get",
    path = "",
    version = "v1",
    sandbox = false,
    data,
  }) {
    const requestOptions = {
      baseURL: sandbox
        ? "https://api.sandbox.transferwise.tech"
        : "https://api.transferwise.com",
      url: `/${version}${path}`,
      method,
      headers: {
        Authorization: "Bearer 3dd320ab-2fd2-4ba3-872e-34ff415ceff5",
        "Content-Type": "application/json",
      },
      ...(data && { data }),
    };

    return axios(requestOptions).catch(
      (error) =>
        new Error(
          `${error.name}:${error.message}\n${JSON.stringify(
            {
              ...requestOptions,
              ...{
                ...requestOptions.headers,
                Authorization: "Bearer <API Token>",
              },
            },
            null,
            2
          )}`
        )
    );
  }
};
