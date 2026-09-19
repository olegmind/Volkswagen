const products = [
  [17000, "1.jpg"],
  [15000, "2.jpeg"],
  [12000, "3.jpg"],
  [16000, "4.jpg"],
  [10000, "5.jpg"],
  [17000, "6.jpg"],
  [18000, "7.jpg"],
  [12000, "8.jpg"],
  [18500, "pexels-234741447-12499702.jpg"],
  [16200, "pexels-ardit-mbrati-216809103-16646416.jpg"],
  [14300, "pexels-can-acikgoz-2151734019-31825291.jpg"],
  [19800, "pexels-clement-proust-363898785-21880068.jpg"],
  [17600, "pexels-connorscottmcmanus-15240993.jpg"],
  [15400, "pexels-hellojoshwithers-16625624.jpg"],
  [22100, "pexels-introspectivedsgn-4713812.jpg"],
  [16900, "pexels-o-click-fotografias-2163822876-39218495.jpg"],
  [12800, "pexels-pexels-user-399617868-14840571.jpg"],
  [20700, "pexels-tshepang-dd2-2159673654-36674013.jpg"],
  [23900, "pexels-vlasceanu-20027400.jpg"],
  [14300, "pexels-can-acikgoz-2151734019-31825291.jpg"],
  [12000, "8.jpg"],
].map((x, i) => ({
  id: i + 1,
  title: `Volkswagen ${i + 1}`,
  priceUSD: x[0],
  img: `images/${x[1]}`,
}));

const STORAGE_KEY = "volkswagen-cart-v1";
const grid = document.getElementById("productsGrid");
const currencySelect = document.getElementById("currencySelect");
const rateInfo = document.getElementById("rateInfo");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const buyCartButton = document.getElementById("buyCartButton");
const headerCartButton = document.getElementById("headerCartButton");
const cartBadge = document.getElementById("cartBadge");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const closeCartButton = document.getElementById("closeCartButton");
const cartEmptyState = document.getElementById("cartEmptyState");
const cartContent = document.getElementById("cartContent");
const continueShoppingButton = document.getElementById("continueShoppingButton");
const imageViewerOverlay = document.getElementById("imageViewerOverlay");
const imageViewerImage = document.getElementById("imageViewerImage");
const closeImageViewerButton = document.getElementById("closeImageViewerButton");

let cart = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let currentCurrency = "USD";
let ratesUAH = { UAH: 1 };

const formatters = ["USD", "EUR", "UAH", "GBP"].reduce(
  (a, c) => (
    (a[c] = new Intl.NumberFormat("uk-UA", { style: "currency", currency: c })),
    a
  ),
  {}
);

const convertFromUSD = (usd, cur) =>
  !ratesUAH.USD || !ratesUAH[cur] ? null : (usd * ratesUAH.USD) / ratesUAH[cur];

const fmt = (v, c) =>
  (
    formatters[c] ||
    new Intl.NumberFormat("uk-UA", { style: "currency", currency: c })
  ).format(v);

function saveCart() {
  if (!cart.length) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function closeAllExpandedImages() {
  if (!grid) return;

  grid.querySelectorAll(".box img").forEach((img) => {
    img.classList.remove("is-expanded");
  });
}

function closeImageViewer() {
  if (!imageViewerOverlay || !imageViewerImage) return;

  imageViewerOverlay.classList.remove("is-open");
  imageViewerOverlay.setAttribute("aria-hidden", "true");
  imageViewerImage.src = "";
  imageViewerImage.alt = "Збільшене фото автомобіля";
}

function openImageViewer(img) {
  if (!img || !imageViewerOverlay || !imageViewerImage) return;

  closeAllExpandedImages();
  img.classList.add("is-expanded");

  imageViewerImage.src = img.currentSrc || img.src;
  imageViewerImage.alt = img.alt || "Фото автомобіля";
  imageViewerOverlay.classList.add("is-open");
  imageViewerOverlay.setAttribute("aria-hidden", "false");
}

function bindProductImageZoom() {
  if (!grid) return;

  grid.addEventListener(
    "click",
    (event) => {
      const img = event.target.closest(".box img");
      if (!img) return;

      openImageViewer(img);
    },
    { passive: true }
  );
}

function renderProducts(currency = "USD") {
  if (!grid) return;
  grid.innerHTML = products
    .map(
      (p) => `
    <div class="box">
      <img src="${p.img}" alt="${p.title}" loading="lazy" onerror="this.style.opacity=0;this.nextElementSibling.style.marginTop='0'"/>
      <p>${p.title}</p>
      <p class="price" data-price-usd="${p.priceUSD}">${fmt(
        p.priceUSD,
        "USD"
      )}</p>
      <button type="button" data-id="${p.id}">Купити</button>
    </div>`
    )
    .join("");

  grid.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(Number(btn.dataset.id)));
  });

  bindProductImageZoom();
  updatePrices(currency);
}

function updatePrices(currency) {
  if (!grid) return;
  currentCurrency = currency;

  grid.querySelectorAll(".price").forEach((el) => {
    const usd = Number(el.dataset.priceUsd);
    const val = currency === "USD" ? usd : convertFromUSD(usd, currency);
    el.textContent = fmt(val ?? usd, currency);
  });

  if (rateInfo) {
    if (currency === "UAH" && ratesUAH.USD)
      rateInfo.textContent = `Курс НБУ: 1 USD = ${ratesUAH.USD.toFixed(2)} UAH`;
    else if (ratesUAH[currency] && ratesUAH.USD) {
      const cross = ratesUAH.USD / ratesUAH[currency];
      rateInfo.textContent = `Орієнтовно: 1 USD ≈ ${cross.toFixed(4)} ${currency}`;
    } else {
      rateInfo.textContent = "";
    }
  }

  renderCart();
}

async function loadRates() {
  try {
    const resp = await fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json");
    if (!resp.ok) throw new Error("Network response was not ok");
    const data = await resp.json();
    data.forEach((i) => (ratesUAH[i.cc] = Number(i.rate)));
  } catch (e) {
    ratesUAH = { USD: 40, EUR: 43, GBP: 50, UAH: 1 };
  }
}

function fillCurrencySelect() {
  if (!currencySelect) return;
  ["USD", "EUR", "UAH", "GBP"]
    .filter((cc) => ratesUAH[cc])
    .forEach((cc) => {
      const option = document.createElement("option");
      option.value = cc;
      option.textContent = cc;
      currencySelect.appendChild(option);
    });
  currencySelect.value = "USD";
}

function openCart() {
  if (!cartDrawer || !cartOverlay) return;
  cartDrawer.classList.add("is-open");
  cartOverlay.classList.add("is-visible");
  headerCartButton?.setAttribute("aria-expanded", "true");
}

function closeCart() {
  if (!cartDrawer || !cartOverlay) return;
  cartDrawer.classList.remove("is-open");
  cartOverlay.classList.remove("is-visible");
  headerCartButton?.setAttribute("aria-expanded", "false");
}

function toggleCart() {
  if (!cartDrawer || !cartOverlay) return;
  const isOpen = cartDrawer.classList.contains("is-open");
  if (isOpen) {
    closeCart();
  } else {
    openCart();
  }
}

function getItemCurrencyPrice(item, currency = currentCurrency) {
  const usdPrice = Number(item.priceUSD || 0);
  if (currency === "USD") return usdPrice;
  const converted = convertFromUSD(usdPrice, currency);
  return converted ?? usdPrice;
}

function updateCartBadge() {
  if (!cartBadge) return;
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  if (totalItems > 0) {
    cartBadge.hidden = false;
    cartBadge.textContent = totalItems;
  } else {
    cartBadge.hidden = true;
    cartBadge.textContent = "0";
  }
}

function renderCart() {
  if (!cartItems || !cartTotal) return;

  updateCartBadge();
  cartItems.innerHTML = "";

  if (!cart.length) {
    cartEmptyState?.classList.remove("hidden");
    cartContent?.classList.add("hidden");
    cartTotal.textContent = "0 ₴";
    saveCart();
    return;
  }

  cartEmptyState?.classList.add("hidden");
  cartContent?.classList.remove("hidden");

  let total = 0;
  cart.forEach((item) => {
    const itemTotal = getItemCurrencyPrice(item) * item.qty;
    total += itemTotal;

    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <img class="cart-item-image" src="${item.img}" alt="${item.title}" />
      <div class="cart-item-main">
        <div class="cart-item-top">
          <h4 class="cart-item-title">${item.title}</h4>
          <button class="remove-item-button" data-action="remove" data-id="${item.id}" type="button" aria-label="Видалити товар">×</button>
        </div>
        <div class="cart-item-price">${fmt(getItemCurrencyPrice(item), currentCurrency)}</div>
        <div class="cart-item-actions">
          <div class="quantity-control">
            <button class="qty-button" type="button" data-action="decrease" data-id="${item.id}" aria-label="Зменшити кількість">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-button" type="button" data-action="increase" data-id="${item.id}" aria-label="Збільшити кількість">+</button>
          </div>
          <strong class="cart-item-total">${fmt(itemTotal, currentCurrency)}</strong>
        </div>
      </div>
    `;
    cartItems.appendChild(li);
  });

  cartTotal.textContent = `${fmt(total, currentCurrency)}`;
  saveCart();
}

function addToCart(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;

  const found = cart.find((item) => item.id === id);
  if (found) {
    found.qty += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      priceUSD: product.priceUSD,
      img: product.img,
      qty: 1,
    });
  }

  renderCart();
}

function changeQuantity(id, delta) {
  const item = cart.find((entry) => entry.id === id);
  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    cart = cart.filter((entry) => entry.id !== id);
  }

  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  renderCart();
}

function buyCart() {
  if (!cart.length) {
    alert("Кошик порожній");
    return;
  }

  const total = cart.reduce((sum, item) => sum + getItemCurrencyPrice(item) * item.qty, 0);
  alert(`Замовлення оформлено! Сума: ${fmt(total, currentCurrency)}`);
  cart = [];
  renderCart();
  closeCart();
}

function wireEvents() {
  if (currencySelect) {
    currencySelect.addEventListener("change", (event) => {
      updatePrices(event.target.value);
    });
  }

  if (headerCartButton) {
    headerCartButton.addEventListener("click", toggleCart);
  }

  if (cartOverlay) {
    cartOverlay.addEventListener("click", closeCart);
  }

  if (closeCartButton) {
    closeCartButton.addEventListener("click", closeCart);
  }

  if (continueShoppingButton) {
    continueShoppingButton.addEventListener("click", closeCart);
  }

  if (buyCartButton) {
    buyCartButton.addEventListener("click", buyCart);
  }

  if (closeImageViewerButton) {
    closeImageViewerButton.addEventListener("click", closeImageViewer);
  }

  if (imageViewerOverlay) {
    imageViewerOverlay.addEventListener("click", (event) => {
      if (event.target === imageViewerOverlay) {
        closeImageViewer();
      }
    });
  }

  if (cartItems) {
    cartItems.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-action]");
      const removeButton = event.target.closest("[data-action='remove']");

      if (removeButton) {
        const id = Number(removeButton.dataset.id);
        removeFromCart(id);
        return;
      }

      if (actionButton) {
        const id = Number(actionButton.dataset.id);
        const action = actionButton.dataset.action;
        if (action === "increase") {
          changeQuantity(id, 1);
        }
        if (action === "decrease") {
          changeQuantity(id, -1);
        }
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCart();
      closeImageViewer();
    }
  });
}

(async function () {
  await loadRates();
  fillCurrencySelect();
  renderProducts("USD");
  wireEvents();
})();
