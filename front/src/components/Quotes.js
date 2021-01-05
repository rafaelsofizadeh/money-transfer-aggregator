import React, { useState } from "react";

import QuoteForm from "./QuoteForm";
import Cards from "./Cards";

const Quotes = () => {
  const [quotes, setQuotes] = useState({ request: {}, response: [] });
  console.log("Quotes", quotes);

  return (
    <>
      <QuoteForm handleData={setQuotes} />
      <Cards data={quotes} />
    </>
  );
};

export default Quotes;
