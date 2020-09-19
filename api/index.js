const axios = require("axios");
const puppeteer = require("puppeteer-extra");
const plugin = require("puppeteer-extra-plugin-angular");
puppeteer.use(plugin());

const config = require("../config.json");
const port = config["port"];

const browser = await puppeteer.launch({});

const transferwiseGetQuote = Transferwise(true);
const skrillGetQuote = await RequestInterceptScraper(
  browser,
  "https://transfers.skrill.com/smt/calculator/marketing",
  "body > dr-root > div > ng-component > div > dr-transfer-calculator > div > ul > li.calculator__sender > dr-amount > label > input",
  "/preview"
);
const spokoGetQuote = await RequestInterceptScraper(
  browser,
  "https://spoko.app",
  "#layout > div > div:nth-child(2) > div > div > div.hero > div.spokoRootIndex-calcWrapper.right > div > form > div:nth-child(1) > div:nth-child(2) > div.wrap > input",
  "/calculate"
);

const controller = ({
  transferwiseGetQuote,
  skrillGetQuote,
  spokoGetQuote,
}) => async (request, response) => {
  const {
    senderCurrency,
    senderCountry,
    recipientCurrency,
    recipientCountry,
    senderAmount,
  } = request.query;

  if (
    !mapping.countryCodes[senderCountry] ||
    !mapping.countryCodes[recipientCountry] ||
    mapping.currencyCodes.indexOf(senderCurrency) < 0 ||
    !mapping.currencyCodes.indexOf(recipientCurrency) < 0
  ) {
    response.status(400);
    return response.json({
      error: "Please enter a valid ISO 3166-1 alpha-3 country code.",
    });
  }

  const transferwiseResult = transferwiseGetQuote(
    senderCurrency,
    recipientCurrency,
    senderAmount
  );

  const skrillResult = await skrillGetQuote({
    senderCurrency,
    senderCountry,
    recipientCurrency,
    recipientCountry,
    senderAmount,
  });

  const spokoResult = await spokoGetQuote({
    sourceCurrency: senderCurrency,
    destinationCurrency: recipientCurrency,
    sourceAmount: senderAmount,
  });

  const easysendResult = easysendGetQuote(
    mapping.countryCodes[senderCountry],
    senderCurrency,
    mapping.countryCodes[recipientCountry],
    recipientCurrency,
    (senderAmount * 100).toString()
  );

  return Promise.allSettled([
    transferwiseResult,
    skrillResult,
    easysendResult,
    spokoResult,
  ]).then(([transferwise, skrill, easysend, spoko]) => {
    response.header("Content-Type", "application/json");
    response.send(
      JSON.stringify(
        {
          transferwise,
          skrill,
          easysend,
          spoko,
        },
        null,
        2
      )
    );
  });
};

function Transferwise(sandbox) {
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
}

async function RequestInterceptScraper(
  browser,
  url,
  triggeringSelector,
  interceptUrl
) {
  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  return async (payload) => {
    await page.setRequestInterception(true);
    const { resolve, reject, promise } = new Deferred();

    addRequestInterceptor(page, payload);
    addResponseInterceptor(page, resolve, reject);

    page.typeIfExists(
      triggeringSelector,
      Math.floor(Math.random() * 1000).toString()
    );

    return promise;
  };

  function addRequestInterceptor(target, payload) {
    target.once("request", requestInterceptor);

    function requestInterceptor(request) {
      if (
        ["image", "font", "stylesheet"].indexOf(request.resourceType()) === -1
      ) {
        if (payload && request.url().includes(interceptUrl)) {
          return request.continue({
            postData: JSON.stringify({
              ...JSON.parse(request.postData()),
              ...payload,
            }),
          });
        }
      } else {
        return request.abort();
      }

      return request.continue();
    }
  }

  function addResponseInterceptor(target, resolve, reject) {
    target.once("response", responseInterceptor);

    async function responseInterceptor(response) {
      if (
        response.url().includes(interceptUrl) &&
        typeof resolve === "function"
      ) {
        try {
          await page.setRequestInterception(false);

          const result = await response.json();
          return resolve(result);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      }
    }
  }
}

async function easysendGetQuote(
  senderCountry,
  senderCurrency,
  recipientCountry,
  recipientCurrency,
  senderAmount
) {
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
}

const mapping = {
  transferwise: {
    currencies: {
      send: [
        "EUR",
        "GBP",
        "INR",
        "USD",
        "AED",
        "AUD",
        "BGN",
        "BRL",
        "CAD",
        "CHF",
        "CZK",
        "DKK",
        "HKD",
        "HRK",
        "HUF",
        "JPY",
        "MYR",
        "NOK",
        "NZD",
        "PLN",
        "RON",
        "SEK",
        "SGD",
        "TRY",
      ],
      receive: [
        "EUR",
        "INR",
        "USD",
        "AED",
        "ARS",
        "AUD",
        "BDT",
        "BGN",
        "BRL",
        "BWP",
        "CAD",
        "CHF",
        "CLP",
        "CNY",
        "COP",
        "CRC",
        "CZK",
        "DKK",
        "EGP",
        "GEL",
        "GHS",
        "HKD",
        "HRK",
        "HUF",
        "IDR",
        "ILS",
        "JPY",
        "KES",
        "KRW",
        "LKR",
        "MAD",
        "MXN",
        "MYR",
        "NGN",
        "NOK",
        "NPR",
        "NZD",
        "PEN",
        "PHP",
        "PKR",
        "PLN",
        "RON",
        "RUB",
        "SEK",
        "SGD",
        "THB",
        "TRY",
        "TZS",
        "UAH",
        "UGX",
        "UYU",
        "VND",
        "XOF",
        "ZAR",
        "ZMW",
      ],
    },
  },
  skrill: {
    countries: {
      send: [
        "GBR",
        "AND",
        "AUS",
        "AUT",
        "BEL",
        "BGR",
        "CAN",
        "COL",
        "HRV",
        "CYP",
        "CZE",
        "DNK",
        "EST",
        "FIN",
        "FRA",
        "DEU",
        "GRC",
        "HKG",
        "HUN",
        "ISL",
        "IND",
        "IRL",
        "ISR",
        "ITA",
        "KOR",
        "KWT",
        "LVA",
        "LTU",
        "LUX",
        "MYS",
        "MLT",
        "MAR",
        "NLD",
        "NZL",
        "NOR",
        "POL",
        "PRT",
        "QAT",
        "ROU",
        "SAU",
        "SRB",
        "SGP",
        "SVK",
        "SVN",
        "ZAF",
        "ESP",
        "SWE",
        "CHE",
        "TWN",
        "THA",
        "TUN",
        "TUR",
        "ARE",
        "USA",
      ],
      receive: [
        "LVA",
        "AUS",
        "AUT",
        "BGD",
        "BEL",
        "BRA",
        "CYP",
        "EST",
        "FIN",
        "FRA",
        "DEU",
        "GRC",
        "IND",
        "IDN",
        "IRL",
        "ITA",
        "KEN",
        "LTU",
        "LUX",
        "MYS",
        "MLT",
        "MEX",
        "MCO",
        "NPL",
        "NLD",
        "NGA",
        "PAK",
        "PHL",
        "POL",
        "PRT",
        "SMR",
        "SVK",
        "SVN",
        "ESP",
        "LKA",
        "THA",
        "GBR",
        "USA",
        "VNM",
      ],
    },
    currencies: {
      send: [
        "GBP",
        "EUR",
        "AUD",
        "BGN",
        "CAD",
        "COP",
        "HRK",
        "CZK",
        "DKK",
        "HKD",
        "HUF",
        "ISK",
        "INR",
        "ILS",
        "KRW",
        "KWD",
        "MYR",
        "MAD",
        "NZD",
        "NOK",
        "PLN",
        "QAR",
        "RON",
        "SAR",
        "RSD",
        "SGD",
        "ZAR",
        "SEK",
        "CHF",
        "TWD",
        "THB",
        "TND",
        "TRY",
        "AED",
        "USD",
      ],
      receive: [
        "EUR",
        "AUD",
        "BDT",
        "BRL",
        "INR",
        "IDR",
        "KES",
        "MYR",
        "MXN",
        "NPR",
        "NGN",
        "PKR",
        "PHP",
        "PLN",
        "LKR",
        "THB",
        "GBP",
        "USD",
        "VND",
      ],
    },
  },
  countryCodes: {
    AFG: "AF",
    ALB: "AL",
    DZA: "DZ",
    ASM: "AS",
    AND: "AD",
    AGO: "AO",
    AIA: "AI",
    ATA: "AQ",
    ATG: "AG",
    ARG: "AR",
    ARM: "AM",
    ABW: "AW",
    AUS: "AU",
    AUT: "AT",
    AZE: "AZ",
    BHS: "BS",
    BHR: "BH",
    BGD: "BD",
    BRB: "BB",
    BLR: "BY",
    BEL: "BE",
    BLZ: "BZ",
    BEN: "BJ",
    BMU: "BM",
    BTN: "BT",
    BOL: "BO",
    BIH: "BA",
    BWA: "BW",
    BVT: "BV",
    BRA: "BR",
    IOT: "IO",
    BRN: "BN",
    BGR: "BG",
    BFA: "BF",
    BDI: "BI",
    KHM: "KH",
    CMR: "CM",
    CAN: "CA",
    CPV: "CV",
    CYM: "KY",
    CAF: "CF",
    TCD: "TD",
    CHL: "CL",
    CHN: "CN",
    CXR: "CX",
    CCK: "CC",
    COL: "CO",
    COM: "KM",
    COG: "CG",
    COD: "CD",
    COK: "CK",
    CRI: "CR",
    CIV: "CI",
    HRV: "HR",
    CUB: "CU",
    CYP: "CY",
    CZE: "CZ",
    DNK: "DK",
    DJI: "DJ",
    DMA: "DM",
    DOM: "DO",
    ECU: "EC",
    EGY: "EG",
    SLV: "SV",
    GNQ: "GQ",
    ERI: "ER",
    EST: "EE",
    ETH: "ET",
    FLK: "FK",
    FRO: "FO",
    FJI: "FJ",
    FIN: "FI",
    FRA: "FR",
    GUF: "GF",
    PYF: "PF",
    ATF: "TF",
    GAB: "GA",
    GMB: "GM",
    GEO: "GE",
    DEU: "DE",
    GHA: "GH",
    GIB: "GI",
    GRC: "GR",
    GRL: "GL",
    GRD: "GD",
    GLP: "GP",
    GUM: "GU",
    GTM: "GT",
    GGY: "GG",
    GIN: "GN",
    GNB: "GW",
    GUY: "GY",
    HTI: "HT",
    HMD: "HM",
    VAT: "VA",
    HND: "HN",
    HKG: "HK",
    HUN: "HU",
    ISL: "IS",
    IND: "IN",
    IDN: "ID",
    IRN: "IR",
    IRQ: "IQ",
    IRL: "IE",
    IMN: "IM",
    ISR: "IL",
    ITA: "IT",
    JAM: "JM",
    JPN: "JP",
    JEY: "JE",
    JOR: "JO",
    KAZ: "KZ",
    KEN: "KE",
    KIR: "KI",
    PRK: "KP",
    KOR: "KR",
    KWT: "KW",
    KGZ: "KG",
    LAO: "LA",
    LVA: "LV",
    LBN: "LB",
    LSO: "LS",
    LBR: "LR",
    LBY: "LY",
    LIE: "LI",
    LTU: "LT",
    LUX: "LU",
    MAC: "MO",
    MKD: "MK",
    MDG: "MG",
    MWI: "MW",
    MYS: "MY",
    MDV: "MV",
    MLI: "ML",
    MLT: "MT",
    MHL: "MH",
    MTQ: "MQ",
    MRT: "MR",
    MUS: "MU",
    MYT: "YT",
    MEX: "MX",
    FSM: "FM",
    MDA: "MD",
    MCO: "MC",
    MNG: "MN",
    MNE: "ME",
    MSR: "MS",
    MAR: "MA",
    MOZ: "MZ",
    MMR: "MM",
    NAM: "NA",
    NRU: "NR",
    NPL: "NP",
    NLD: "NL",
    ANT: "AN",
    NCL: "NC",
    NZL: "NZ",
    NIC: "NI",
    NER: "NE",
    NGA: "NG",
    NIU: "NU",
    NFK: "NF",
    MNP: "MP",
    NOR: "NO",
    OMN: "OM",
    PAK: "PK",
    PLW: "PW",
    PSE: "PS",
    PAN: "PA",
    PNG: "PG",
    PRY: "PY",
    PER: "PE",
    PHL: "PH",
    PCN: "PN",
    POL: "PL",
    PRT: "PT",
    PRI: "PR",
    QAT: "QA",
    REU: "RE",
    ROU: "RO",
    RUS: "RU",
    RWA: "RW",
    SHN: "SH",
    KNA: "KN",
    LCA: "LC",
    SPM: "PM",
    VCT: "VC",
    WSM: "WS",
    SMR: "SM",
    STP: "ST",
    SAU: "SA",
    SEN: "SN",
    SRB: "RS",
    SYC: "SC",
    SLE: "SL",
    SGP: "SG",
    SVK: "SK",
    SVN: "SI",
    SLB: "SB",
    SOM: "SO",
    ZAF: "ZA",
    SGS: "GS",
    SSD: "SS",
    ESP: "ES",
    LKA: "LK",
    SDN: "SD",
    SUR: "SR",
    SJM: "SJ",
    SWZ: "SZ",
    SWE: "SE",
    CHE: "CH",
    SYR: "SY",
    TWN: "TW",
    TJK: "TJ",
    TZA: "TZ",
    THA: "TH",
    TLS: "TL",
    TGO: "TG",
    TKL: "TK",
    TON: "TO",
    TTO: "TT",
    TUN: "TN",
    TUR: "TR",
    TKM: "TM",
    TCA: "TC",
    TUV: "TV",
    UGA: "UG",
    UKR: "UA",
    ARE: "AE",
    GBR: "GB",
    USA: "US",
    UMI: "UM",
    URY: "UY",
    UZB: "UZ",
    VUT: "VU",
    VEN: "VE",
    VNM: "VN",
    VGB: "VG",
    VIR: "VI",
    WLF: "WF",
    ESH: "EH",
    YEM: "YE",
    ZMB: "ZM",
    ZWE: "ZW",
  },
  currencyCodes: [
    "AFN",
    "EUR",
    "ALL",
    "DZD",
    "USD",
    "AOA",
    "XCD",
    "ARS",
    "AMD",
    "AWG",
    "AUD",
    "AZN",
    "BSD",
    "BHD",
    "BDT",
    "BBD",
    "BYN",
    "BZD",
    "XOF",
    "BMD",
    "INR",
    "BTN",
    "BOB",
    "BOV",
    "BAM",
    "BWP",
    "NOK",
    "BRL",
    "BND",
    "BGN",
    "BIF",
    "CVE",
    "KHR",
    "XAF",
    "CAD",
    "KYD",
    "CLP",
    "CLF",
    "CNY",
    "COP",
    "COU",
    "KMF",
    "CDF",
    "NZD",
    "CRC",
    "HRK",
    "CUP",
    "CUC",
    "ANG",
    "CZK",
    "DKK",
    "DJF",
    "DOP",
    "EGP",
    "SVC",
    "ERN",
    "SZL",
    "ETB",
    "FKP",
    "FJD",
    "XPF",
    "GMD",
    "GEL",
    "GHS",
    "GIP",
    "GTQ",
    "GBP",
    "GNF",
    "GYD",
    "HTG",
    "HNL",
    "HKD",
    "HUF",
    "ISK",
    "IDR",
    "XDR",
    "IRR",
    "IQD",
    "ILS",
    "JMD",
    "JPY",
    "JOD",
    "KZT",
    "KES",
    "KPW",
    "KRW",
    "KWD",
    "KGS",
    "LAK",
    "LBP",
    "LSL",
    "ZAR",
    "LRD",
    "LYD",
    "CHF",
    "MOP",
    "MKD",
    "MGA",
    "MWK",
    "MYR",
    "MVR",
    "MRU",
    "MUR",
    "XUA",
    "MXN",
    "MXV",
    "MDL",
    "MNT",
    "MAD",
    "MZN",
    "MMK",
    "NAD",
    "NPR",
    "NIO",
    "NGN",
    "OMR",
    "PKR",
    "PAB",
    "PGK",
    "PYG",
    "PEN",
    "PHP",
    "PLN",
    "QAR",
    "RON",
    "RUB",
    "RWF",
    "SHP",
    "WST",
    "STN",
    "SAR",
    "RSD",
    "SCR",
    "SLL",
    "SGD",
    "XSU",
    "SBD",
    "SOS",
    "SSP",
    "LKR",
    "SDG",
    "SRD",
    "SEK",
    "CHE",
    "CHW",
    "SYP",
    "TWD",
    "TJS",
    "TZS",
    "THB",
    "TOP",
    "TTD",
    "TND",
    "TRY",
    "TMT",
    "UGX",
    "UAH",
    "AED",
    "USN",
    "UYU",
    "UYI",
    "UYW",
    "UZS",
    "VUV",
    "VES",
    "VND",
    "YER",
    "ZMW",
    "ZWL",
  ],
};

function Deferred() {
  let deferred = {};
  let promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return { ...deferred, promise };
}

module.exports = controller({
  transferwiseGetQuote,
  skrillGetQuote,
  spokoGetQuote,
});
