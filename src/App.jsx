import { useEffect, useState } from "react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import facebookIcon from "../images/futer image/f.png";
import instagramIcon from "../images/futer image/inst.png";
import linkedinIcon from "../images/futer image/in.png";
import twitterIcon from "../images/futer image/t.png";
import volkswagenLogo from "../images/volkswagen-logo.webp";
import { products } from "./data/products.js";

const STORAGE_KEY = "volkswagen-cart-v1";
const FALLBACK_RATES = { USD: 40, EUR: 43, GBP: 50, UAH: 1 };
const CURRENCIES = ["USD", "EUR", "UAH", "GBP"];
const formatters = Object.fromEntries(
  CURRENCIES.map((currency) => [
    currency,
    new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency,
    }),
  ]),
);

const infoCards = [
  {
    title: "Можливості розміщення",
    items: ["Просування авто в пошуку", "Вигоди на ТОП до -45%", "Вигоди на публікації до -45%"],
  },
  {
    title: "Запчастини та аксесуари",
    items: ["Нові і б/у запчастини", "Шини та диски", "Гаражі по всій Україні"],
  },
  {
    title: "Підбір авто",
    items: ["Пошук перевірених авто", "Пошук нових авто", "Пошук з-за кордону"],
  },
  {
    title: "Сервіси VOLKSWAGEN",
    items: ["Пошук перевірених авто", "Перевірені авто на VOLKSWAGEN", "Офіційні тести з ПДР України"],
  },
  {
    title: "Автосалони",
    items: ["Автосалони всієї України", "Автодилери вживаних авто", "Авто під замовлення з-за кордону"],
  },
  {
    title: "Інструменти",
    items: ["Митний калькулятор", "Калькулятор середньої ціни", "СТО"],
  },
];

function formatPrice(amount, currency) {
  return formatters[currency].format(amount);
}

function readSavedCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(savedCart)) return [];

    return savedCart.flatMap((item) => {
      if (!item || !Number.isInteger(item.id) || !Number.isInteger(item.qty) || item.qty <= 0) {
        return [];
      }
      const product = products.find((entry) => entry.id === item.id);
      return product ? [{ ...product, qty: item.qty }] : [];
    });
  } catch (error) {
    console.warn("Не вдалося прочитати збережений кошик.", error);
    return [];
  }
}

function Header({ currency, onCurrencyChange, rateInfo, isFallback, cartCount, cartOpen, onOpenCart }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header>
      <div className="content">
        <a className="logo" href="index.html" aria-label="Volkswagen — головна">
          <img src={volkswagenLogo} alt="Логотип Volkswagen" width="75" height="54" />
        </a>
        <input
          type="checkbox"
          id="menuToggle"
          className="menu-toggle"
          aria-label="Відкрити меню"
          checked={menuOpen}
          onChange={(event) => setMenuOpen(event.target.checked)}
        />
        <label className="burger" htmlFor="menuToggle" aria-label="Відкрити меню">
          <span />
          <span />
          <span />
        </label>
        <nav className="menu" aria-label="Головне меню">
          <ul>
            <li><a className="header-button" href="index.html">Головна</a></li>
            <li><a className="header-button" href="#contacts">Контакти</a></li>
            <li><a className="header-button" href="credit.html">Кредит</a></li>
            <li><a className="header-button" href="servise.html">Сервіс</a></li>
          </ul>
        </nav>

        <div className="header-actions">
          <div className="currency-panel-header">
            <label htmlFor="currencySelect">Валюта цін:</label>
            <select
              id="currencySelect"
              aria-label="Оберіть валюту"
              value={currency}
              onChange={(event) => onCurrencyChange(event.target.value)}
            >
              {CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}
            </select>
            <span id="rateInfo" className={isFallback ? "is-fallback" : ""} role="status" aria-live="polite">
              {rateInfo}
            </span>
          </div>
          <div className="header-cart-area">
            <button
              className="header-cart-button"
              type="button"
              aria-label="Відкрити кошик"
              aria-expanded={cartOpen}
              onClick={onOpenCart}
            >
              <span className="header-cart-icon">🛒</span>
              <span className="header-cart-text">Кошик</span>
              <span className="cart-badge" hidden={cartCount === 0}>{cartCount}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function ProductCard({ product, price, onAdd, onOpenImage }) {
  return (
    <article className="box">
      <img
        src={product.img}
        alt={product.title}
        loading="lazy"
        decoding="async"
        onClick={() => onOpenImage(product)}
        onError={(event) => { event.currentTarget.style.opacity = "0"; }}
      />
      <p>{product.title}</p>
      <p className="price">{price}</p>
      <button type="button" onClick={() => onAdd(product.id)}>Купити</button>
    </article>
  );
}

function CartDrawer({ cart, currency, rates, isOpen, onClose, onChangeQuantity, onRemove, onCheckout }) {
  const total = cart.reduce(
    (sum, item) => sum + (item.priceUSD * rates.USD) / rates[currency] * item.qty,
    0,
  );

  return (
    <>
      <div
        className={`cart-overlay${isOpen ? " is-visible" : ""}`}
        aria-hidden={!isOpen}
        onClick={onClose}
      />
      <aside className={`cart-drawer${isOpen ? " is-open" : ""}`} aria-label="Кошик" aria-live="polite">
        <div className="cart-drawer-header">
          <h3>🛒 Кошик</h3>
          <button className="close-cart-button" type="button" aria-label="Закрити кошик" onClick={onClose}>Закрити</button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty-state">
            <p>Ваш кошик порожній</p>
            <button type="button" className="secondary-button" onClick={onClose}>Перейти до покупок</button>
          </div>
        ) : (
          <div className="cart-content">
            <ul id="cartItems">
              {cart.map((item) => {
                const itemPrice = (item.priceUSD * rates.USD) / rates[currency];
                return (
                  <li className="cart-item" key={item.id}>
                    <img className="cart-item-image" src={item.img} alt={item.title} />
                    <div className="cart-item-main">
                      <div className="cart-item-top">
                        <h4 className="cart-item-title">{item.title}</h4>
                        <button
                          className="remove-item-button"
                          type="button"
                          aria-label={`Видалити ${item.title}`}
                          onClick={() => onRemove(item.id)}
                        >
                          ×
                        </button>
                      </div>
                      <div className="cart-item-price">{formatPrice(itemPrice, currency)}</div>
                      <div className="cart-item-actions">
                        <div className="quantity-control">
                          <button
                            className="qty-button"
                            type="button"
                            aria-label="Зменшити кількість"
                            onClick={() => onChangeQuantity(item.id, -1)}
                          >
                            −
                          </button>
                          <span className="qty-value">{item.qty}</span>
                          <button
                            className="qty-button"
                            type="button"
                            aria-label="Збільшити кількість"
                            onClick={() => onChangeQuantity(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                        <strong className="cart-item-total">{formatPrice(itemPrice * item.qty, currency)}</strong>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="cart-footer">
              <div className="cart-total-row">
                <span>Разом:</span>
                <strong>{formatPrice(total, currency)}</strong>
              </div>
              <button type="button" className="primary-button" onClick={onCheckout}>Оформити замовлення</button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function Footer() {
  const socialLinks = [
    ["Facebook", "https://facebook.com", facebookIcon],
    ["Instagram", "https://instagram.com", instagramIcon],
    ["LinkedIn", "https://www.linkedin.com", linkedinIcon],
    ["Twitter", "https://twitter.com", twitterIcon],
  ];

  return (
    <footer>
      <div className="footer-content" id="contacts">
        <div className="footer-text">
          <p>&copy; 2025 Мій сайт. Всі права захищено</p>
          <p>пошта: vw.autoshop.ua@gmail.com</p>
        </div>
        <div className="social-links" aria-label="Соціальні мережі">
          {socialLinks.map(([name, url, icon]) => (
            <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name}>
              <img src={icon} alt={name} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [currency, setCurrency] = useState("USD");
  const [exchange, setExchange] = useState({
    rates: FALLBACK_RATES,
    isFallback: false,
    isLoading: true,
  });
  const [cart, setCart] = useState(readSavedCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [viewedImage, setViewedImage] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadRates() {
      try {
        const response = await fetch(
          "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json",
        );
        if (!response.ok) throw new Error(`NBU API returned HTTP ${response.status}`);

        const data = await response.json();
        const rates = { UAH: 1 };
        data.forEach((item) => {
          const rate = Number(item.rate);
          if (item.cc && Number.isFinite(rate) && rate > 0) rates[item.cc] = rate;
        });
        if (!["USD", "EUR", "GBP"].every((code) => rates[code])) {
          throw new Error("NBU API response is missing a supported currency rate");
        }
        if (active) setExchange({ rates, isFallback: false, isLoading: false });
      } catch (error) {
        console.warn("Не вдалося завантажити курси НБУ. Використовуються резервні курси.", error);
        if (active) setExchange({ rates: FALLBACK_RATES, isFallback: true, isLoading: false });
      }
    }

    loadRates();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (cart.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setCartOpen(false);
        setViewedImage(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const rateInfo = exchange.isLoading
    ? ""
    : exchange.isFallback
      ? "НБУ недоступний — резервні курси"
    : currency === "UAH"
      ? `Курс НБУ: 1 USD = ${exchange.rates.USD.toFixed(2)} UAH`
      : `Орієнтовно: 1 USD ≈ ${(exchange.rates.USD / exchange.rates[currency]).toFixed(4)} ${currency}`;

  function addToCart(id) {
    const product = products.find((item) => item.id === id);
    if (!product) return;

    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === id);
      return existing
        ? currentCart.map((item) => item.id === id ? { ...item, qty: item.qty + 1 } : item)
        : [...currentCart, { ...product, qty: 1 }];
    });
  }

  function changeQuantity(id, amount) {
    setCart((currentCart) =>
      currentCart
        .map((item) => item.id === id ? { ...item, qty: item.qty + amount } : item)
        .filter((item) => item.qty > 0),
    );
  }

  function checkout() {
    if (cart.length === 0) {
      window.alert("Кошик порожній");
      return;
    }

    const total = cart.reduce(
      (sum, item) => sum + (item.priceUSD * exchange.rates.USD) / exchange.rates[currency] * item.qty,
      0,
    );
    window.alert(`Замовлення оформлено! Сума: ${formatPrice(total, currency)}`);
    setCart([]);
    setCartOpen(false);
  }

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <>
      <Header
        currency={currency}
        onCurrencyChange={setCurrency}
        rateInfo={rateInfo}
        isFallback={exchange.isFallback}
        cartCount={cartCount}
        cartOpen={cartOpen}
        onOpenCart={() => setCartOpen(true)}
      />
      <CartDrawer
        cart={cart}
        currency={currency}
        rates={exchange.rates}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onChangeQuantity={changeQuantity}
        onRemove={(id) => setCart((currentCart) => currentCart.filter((item) => item.id !== id))}
        onCheckout={checkout}
      />

      <main>
        <section className="promo-hero" aria-label="Автомобілі з пробігом Volkswagen">
          <h1>Автомобілі з пробігом Volkswagen</h1>
          <p>Перевірені авто. Надійні угоди. Вигідні ціни.</p>
        </section>

        <section className="main-content" aria-live="polite">
          {products.map((product) => {
            const price = currency === "USD"
              ? product.priceUSD
              : (product.priceUSD * exchange.rates.USD) / exchange.rates[currency];
            return (
              <ProductCard
                key={product.id}
                product={product}
                price={formatPrice(price, currency)}
                onAdd={addToCart}
                onOpenImage={setViewedImage}
              />
            );
          })}
        </section>

        <section className="grid-container">
          {infoCards.map(({ title, items }) => (
            <div className="grid-item" key={title}>
              <h3>{title}</h3>
              <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ))}
        </section>
      </main>

      {viewedImage && (
        <div
          className="image-viewer-overlay is-open"
          aria-hidden="false"
          onClick={(event) => {
            if (event.target === event.currentTarget) setViewedImage(null);
          }}
        >
          <div className="image-viewer" role="dialog" aria-modal="true" aria-label="Збільшене фото автомобіля">
            <button
              className="image-viewer-close"
              type="button"
              aria-label="Закрити збільшене фото"
              onClick={() => setViewedImage(null)}
            >
              ×
            </button>
            <img src={viewedImage.img} alt={viewedImage.title} />
          </div>
        </div>
      )}

      <Footer />
      <SpeedInsights />
    </>
  );
}
