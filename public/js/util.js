window.getQuoteRequestPayload = window.getQuoteRequestPayload || {};

const opposite = (direction) =>
  direction === "sender" ? "recipient" : "sender";
