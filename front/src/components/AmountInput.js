import React from "react";

const AmountInput = ({
  direction,
  amount,
  setAmount,
  currency,
  setCurrency,
}) => {
  return (
    <div
      id={`amount-input_${direction}`}
      className="amount-input quote-form__block_width_full"
    >
      <legend className="quote-form__label">
        {direction === "sender" ? "Вы отправляете" : "Получают"}:
      </legend>
      <div className="amount-input__fields quote-form__input quote-form__input-wrapper_padded block_borders block_height_std">
        <input
          type="number"
          id={`amount-input_${direction}`}
          className="amount-input__field amount-input__field_numeric"
          placeholder="Количество"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          disabled={direction === "recipient"}
        />

        <select
          id={`currency-selector_${direction}`}
          className="amount-input__currency-selector"
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
        >
          <option value="" disabled>
            Валюта
          </option>
          <option value={currency}>{currency.toUpperCase()}</option>
        </select>
      </div>
    </div>
  );
};

export default AmountInput;
