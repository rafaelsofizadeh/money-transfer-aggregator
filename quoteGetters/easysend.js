const axios = require("axios");

module.exports = async (
  senderCountry,
  senderCurrency,
  recipientCountry,
  recipientCurrency,
  senderAmount
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await axios({
        baseURL: "https://www.easysend.pl/api/v2/public/offers",
        url: `/${senderCountry}/${senderCurrency}/${recipientCountry}/${recipientCurrency}/${senderAmount}`,
      });
      const formattedResult = result.data.data.attributes;

      const exchangeRate = parseFloat(
        formattedResult["exchange_rate"]["calc_rate"]
      );
      const recipientAmount = (parseInt(senderAmount) / 100) * exchangeRate;
      const recipientAmountFinal = formattedResult["transfer_types"][0].fee.map(
        (fee) => ({
          amount:
            recipientAmount -
            (parseInt(fee.value.amount) / 100) *
              (fee.value.currency === senderCurrency ? exchangeRate : 1),
          fee,
        })
      );

      return resolve({
        ...formattedResult,
        recipientAmount: recipientAmountFinal,
      });
    } catch (error) {
      console.error(error);
      return reject(error);
    }
  });
};
