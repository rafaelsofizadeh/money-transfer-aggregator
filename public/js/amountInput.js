const setAmount = (direction, value, element) => {
  window.getQuoteRequestPayload[`${direction}Amount`] = value;

  if (element) {
    element.value = value;
  }
};

const clearAmount = (element, direction) => {
  element.value = null;
  delete window.getQuoteRequestPayload[`${direction}Amount`];
};

["sender", "recipient"].forEach((direction) => {
  const inputElement = document.getElementById(`amount-input--${direction}`);
  const oppositeDirection = opposite(direction);
  const complementaryInputELement = document.getElementById(
    `amount-input--${oppositeDirection}`
  );

  inputElement.addEventListener(
    "input",
    (event) => {
      setAmount(direction, event.target.value);
      clearAmount(complementaryInputELement, oppositeDirection);
    },
    false
  );
});
