const button = document.getElementById("converter-form__main__button");

button.addEventListener("click", (event) => {
  event.preventDefault();

  if (!window.getQuoteRequestPayload) {
    return;
  }

  fetch("/getQuote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify(window.getQuoteRequestPayload),
  })
    .then((response) => response.text())
    .then((text) => console.log(text))
    .catch((error) => console.error(error));
});
