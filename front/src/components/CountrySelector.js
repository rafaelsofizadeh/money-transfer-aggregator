import React, { useState } from "react";

import Autosuggest from "react-autosuggest";
import Flags from "country-flag-icons/react/3x2";

import "../css/country-selector.scss";
import countryData from "../data/countryData.json";
import iso2ToCurrencyMap from "../data/iso2-currency.json";

// searchValue (string)
const getCountries = (searchValue) => {
  const inputValue = searchValue.trim().toLowerCase();
  const inputLength = inputValue.length;

  return inputLength === 0
    ? countryData
    : countryData.filter(
        (country) =>
          country.name.toLowerCase().slice(0, inputLength) === inputValue
      );
};

const renderCountrySuggestion = (countrySuggestion) => {
  const Flag = Flags[countrySuggestion.iso2];

  return (
    <>
      {Flag && <Flag className="country-selector__flag" />}
      <span>{countrySuggestion.name}</span>
    </>
  );
};

const CountrySelector = ({ direction, country, setCountry, setCurrency }) => {
  const [input, setInput] = useState(country.name);
  const [countries, setCountries] = useState(countryData);

  const inputProps = {
    placeholder: "Выберите страну",
    value: input,
    onChange: (event, { newValue }) => setInput(newValue),
  };

  return (
    <>
      <label
        id={`country-selector__label_${direction}`}
        className="quote-form__label"
        htmlFor={`country-selector_${direction}`}
      >
        {direction === "sender" ? "Страна отправления" : "Страна получения"}:
      </label>
      <Autosuggest
        id={`country-selector__${direction}`}
        suggestions={countries}
        // Value (string) passed from inputProps
        onSuggestionsFetchRequested={({ value }) =>
          setCountries(getCountries(value))
        }
        onSuggestionsClearRequested={() => setCountries([])}
        getSuggestionValue={(country) => {
          setCountry(country);

          const correspondingCurrency = iso2ToCurrencyMap[country.iso2] || "";
          setCurrency(correspondingCurrency);

          return country.name;
        }}
        renderSuggestion={renderCountrySuggestion}
        shouldRenderSuggestions={() => true}
        inputProps={inputProps}
        theme={{
          container:
            "country-selector__container block_height_std quote-form__block_width_full quote-form__input block_borders quote-form__input-wrapper_padded",
          containerOpen: "country-selector__container_open",
          input: "country-selector__input quote-form__block_padded",
          inputOpen: "country-selector__input_open",
          inputFocused: "country-selector__input_focused",
          suggestionsContainer:
            "country-selector__suggestion-container quote-form__block_width_full",
          suggestionsContainerOpen:
            "country-selector__suggestion-container_open",
          suggestionsList: "country-selector__suggestion-list",
          suggestion: "country-selector__suggestion block_height_std",
          suggestionFirst: "country-selector__suggestion_first",
          suggestionHighlighted: "country-selector__suggestion_highlighted",
          sectionContainer: "country-selector__section-container",
          sectionContainerFirst: "country-selector__section-container_first",
          sectionTitle: "country-selector__section-title",
        }}
      />
    </>
  );
};

export default CountrySelector;
