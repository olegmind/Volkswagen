const products = [
  [17000, "1.jpg"],
  [15000, "2.jpeg"],
  [12000, "3.jpg"],
  [16000, "4.jpg"],
  [10000, "5.jpg"],
  [17000, "6.jpg"],
  [18000, "7.jpg"],
  [12000, "8.jpg"],
  [7000, "8.jpg"],
  [17000, "5.jpg"],
  [13000, "6.jpg"],
  [25000, "7.jpg"],
  [11500, "8.jpg"],
  [8000, "8.jpg"],
  [11000, "8.jpg"],
].map((x, i) => ({
  id: i + 1,
  title: `Volkswagen ${i + 1}`,
  priceUSD: x[0],
  img: `images/${x[1]}`,
}));

const grid = document.getElementById("productsGrid");
const currencySelect = document.getElementById("currencySelect");
const rateInfo = document.getElementById("rateInfo");

let ratesUAH = { UAH: 1 };
const formatters = ["USD", "EUR", "UAH", "GBP"].reduce(
  (a, c) => (
    (a[c] = new Intl.NumberFormat("uk-UA", { style: "currency", currency: c })),
    a
  ),
  {}
);

const convertFromUSD = (usd, cur) =>
  !ratesUAH.USD || !ratesUAH[cur] ? null : (usd * ratesUAH.USD) * ratesUAH[cur];
const fmt = (v, c) =>
  (
    formatters[c] ||
    new Intl.NumberFormat("uk-UA", { style: "currency", currency: c })
  ).format(v);

function renderProducts(currency = "USD") {
  grid.innerHTML = products
    .map(
      (p) => `
    <div class="box">
      <img src="${p.img}" alt="${
        p.title
      }" loading="lazy" onerror="this.style.opacity=0;this.nextElementSibling.style.marginTop='0'"/>
      <p>${p.title}</p>
      <p class="price" data-price-usd="${p.priceUSD}">${fmt(
        p.priceUSD,
        "USD"
      )}</p>
      <button type="button" data-id="${p.id}">Купити</button>
    </div>`
    )
    .join("");
  updatePrices(currency);
}

function updatePrices(currency) {
  grid.querySelectorAll(".price").forEach((el) => {
    const usd = Number(el.dataset.priceUsd);
    const val = currency === "USD" ? usd : convertFromUSD(usd, currency);
    el.textContent = fmt(val ?? usd, currency);
  });
  if (currency === "UAH" && ratesUAH.USD)
    rateInfo.textContent = `Курс НБУ: 1 USD = ${ratesUAH.USD.toFixed(2)} UAH`;
  else if (ratesUAH[currency] && ratesUAH.USD) {
    const cross = ratesUAH.USD / ratesUAH[currency];
    rateInfo.textContent = `Орієнтовно: 1 USD ≈ ${cross.toFixed( 4 )} ${currency}`;
  } else rateInfo.textContent = "";
}

async function loadRates() {
  try {
    const resp = await fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json");
    const data = await resp.json();
    data.forEach((i) => (ratesUAH[i.cc] = Number(i.rate)));
  } catch (e) {
    ratesUAH = { USD: 1, UAH: 40 };
  }
}

function fillCurrencySelect() {
  ["USD", "EUR", "UAH", "GBP"]
    .filter((cc) => ratesUAH[cc])
    .forEach((cc) => {
      const o = document.createElement("option");
      o.value = cc;
      o.textContent = cc;
      currencySelect.appendChild(o);
    });
  currencySelect.value = "USD";
}

function wireEvents() {
  currencySelect.addEventListener("change", (e) =>
    updatePrices(e.target.value)
  );
}

(async function () {
  await loadRates();
  fillCurrencySelect();
  renderProducts("USD");
  wireEvents();
})();
