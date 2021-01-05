import React, { useEffect, useState } from "react";

import CountrySelector from "./CountrySelector";
import AmountInput from "./AmountInput";
import FormInput from "./FormInput";

import "../css/quote-form.scss";

const QuoteForm = ({ handleData }) => {
  const [senderCountry, setSenderCountry] = useState({
    name: "",
    iso3: "",
    iso2: "",
  });
  const [recipientCountry, setRecipientCountry] = useState({
    name: "",
    iso3: "",
    iso2: "",
  });
  const [senderCurrency, setSenderCurrency] = useState("");
  const [recipientCurrency, setRecipientCurrency] = useState("");
  const [senderAmount, setSenderAmount] = useState("");
  const [recipientAmount, setRecipientAmount] = useState("");

  // TODO: Custom usePreviousValue hook.
  useEffect(() => senderAmount !== "" && setRecipientAmount(""), [
    senderAmount,
  ]);
  useEffect(() => recipientAmount !== "" && setSenderAmount(""), [
    recipientAmount,
  ]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const quoteRequest = {
      senderCountry: senderCountry.iso3,
      recipientCountry: recipientCountry.iso3,
      senderCurrency,
      recipientCurrency,
      senderAmount,
    };

    console.log("form submit", quoteRequest);

    fetch("/getQuote", {
      crossDomain: true,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quoteRequest),
    })
      .then((result) => { console.log(result); return result.json();})
      .then((quoteResponse) =>
        handleData({ request: quoteRequest, response: quoteResponse })
      );
  };

  return (
    <form className="quote-form quote-form_wide" onSubmit={handleSubmit}>
      <FormInput>
        <CountrySelector
          direction="sender"
          country={senderCountry}
          setCountry={setSenderCountry}
          setCurrency={setSenderCurrency}
        />
      </FormInput>

      <FormInput>
        <CountrySelector
          direction="recipient"
          country={recipientCountry}
          setCountry={setRecipientCountry}
          setCurrency={setRecipientCurrency}
        />
      </FormInput>

      <FormInput>
        <AmountInput
          direction="sender"
          amount={senderAmount}
          setAmount={setSenderAmount}
          currency={senderCurrency}
          setCurrency={setSenderCurrency}
        />
      </FormInput>

      <FormInput>
        <AmountInput
          direction="recipient"
          amount={recipientAmount}
          setAmount={setRecipientAmount}
          currency={recipientCurrency}
          setCurrency={setRecipientCurrency}
        />
      </FormInput>

      <button
        type="submit"
        className="block_height_std quote-form__block_width_narrow quote-form__block_accent block_borders_none"
      >
        Сравнить
      </button>
    </form>
  );
};

export default QuoteForm;
