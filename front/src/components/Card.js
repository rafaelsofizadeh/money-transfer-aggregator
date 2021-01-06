import React from "react";

import backgroundImage from "../img/red-low-poly-bg.jpg";
import bankIcon from "../img/icons/bank.png";
import creditCardIcon from "../img/icons/creditCard.png";
import moneyStackIcon from "../img/icons/moneyStack.png";

const Card = function ({
  quoteRequest,
  quote: { serviceName, amount: finalAmount },
  details: {
    name,
    hue,
    logoFileName,
    isTopQuote,
    bestQuote,
    description,
    bonus,
  },
}) {
  return (
    <div className="card block_borders_none" style={{ backgroundImage }}>
      <span className="card__bg" style={{ filter: `hue-rotate(${hue}deg)` }}></span>
      {isTopQuote && (
        <section className="card__section card__top">
          <p>
            {bestQuote.name === serviceName
              ? "лидер рейтинга!!!"
              : [
                  "на ",
                  Math.round(
                    (bestQuote.result - finalAmount + Number.EPSILON) * 100
                  ) / 100,
                  "",
                  <span className="currency">
                    {quoteRequest.recipientCurrency}
                  </span>,
                  " меньше чем у ",
                  bestQuote.officialName,
                ]}
          </p>
        </section>
      )}
      <section className="card__section card__logo-section">
        <img
          className="card__logo"
          src={`${process.env.PUBLIC_URL}/img/logos/${logoFileName}`}
          alt={`${serviceName} logo`}
        />
      </section>

      <section className="card__section card__payment-methods-section">
        <div className="card__payment-methods-direction-section">
          <p className="card__payment-methods-direction">платите</p>
          <div className="card__payment-methods card__block block_center block_borders block_height_smaller card__block_width_smaller block_opaque_less">
            <img
              className="card__payment-methods-icon"
              src={creditCardIcon}
              alt="Payment Icon – Card"
            />
            <img
              className="card__payment-methods-icon"
              src={moneyStackIcon}
              alt="Payment Icon – Cash"
            />
            <img
              className="card__payment-methods-icon"
              src={bankIcon}
              alt="Payment Icon – Bank"
            />
          </div>
        </div>

        <div className="card__payment-methods-direction-section">
          <p className="card__payment-methods-direction">получаете</p>
          <div className="card__payment-methods card__block block_center block_borders block_height_smaller card__block_width_smaller block_opaque_less">
            <img
              className="card__payment-methods-icon"
              src={creditCardIcon}
              alt="Payment Icon – Card"
            />
            <img
              className="card__payment-methods-icon"
              src={moneyStackIcon}
              alt="Payment Icon – Cash"
            />
          </div>
        </div>
      </section>

      <section className="card__section card__quote-section">
        <div className="card__quote card__quote_initial card__block block_center block_borders block_height_std block_opaque_more block_light">
          <p className="card__quote-data card__quote-data-input">
            {quoteRequest.senderAmount}
            <span className="currency">{quoteRequest.senderCurrency}</span>
          </p>
          <p className="card__quote-data card__quote-data-output">
            {finalAmount}
            <span className="currency">{quoteRequest.recipientCurrency}</span>
          </p>
        </div>
      </section>

      <section className="card__section card__quote-description-section">
        <ul className="card__quote-description">
          {description.map((point, index) => (
            <li
              key={`description-${index}`}
              className="card__quote-description-point"
            >
              <span className="card__quote-description-point-text">
                {point}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card__section card__bonus-section">
        <div className="card__bonus block_center">
          <div className="card__bonus-value card__block block_center block_borders_none block_height_smaller card__block_width_smaller">
            <p>
              + {bonus.exists ? "N" : "0"} <span className="currency">CUR</span>
            </p>
          </div>
          <p className="card__bonus-description card__label-under">
            {bonus.exists
              ? `бонус от ${bonus.sponsor} всем новым клиентам за перевод свыше N CUR`
              : "выплаты клиентам не предусмотрены"}
          </p>
        </div>
      </section>

      <section className="card__section card__quote-section">
        <div className="card__quote_regular card__block block_borders block_height_std block_opaque_less block_light">
          <p className="card__quote-data card__quote-data-output">
            {finalAmount}
            <span className="currency">{quoteRequest.recipientCurrency}</span>
          </p>
        </div>
        <p className="card__label-under">
          последующие переводы с учетом комиссии
        </p>
      </section>

      <section className="card__section card__button-section">
        <div className="card__button card__block block_borders block_center block_height_std block_opaque_more block_dark">
          <p className="card__button-text">подробнее ➤</p>
          <img className="card__button-icon" src="" alt="" />
        </div>
      </section>
    </div>
  );
};

export default Card;
