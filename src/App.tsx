import { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import facebookIcon from "../images/futer image/f.png";
import instagramIcon from "../images/futer image/inst.png";
import linkedinIcon from "../images/futer image/in.png";
import twitterIcon from "../images/futer image/t.png";
import volkswagenLogo from "../images/volkswagen-logo.webp";
import ApplicationForm from "./components/ApplicationForm";
import { products } from "./data/products";
import { calculateCredit } from "./domain/credit";
import { filterAndSortVehicles, type VehicleSort } from "./domain/vehicles";
import type { CartItem, Currency, Exchange, Vehicle } from "./types";

const CART_STORAGE_KEY = "volkswagen-cart-v1";
const FAVORITES_STORAGE_KEY = "volkswagen-favorites-v1";
const FALLBACK_RATES: Exchange["rates"] = { USD: 40, EUR: 43, GBP: 50, UAH: 1 };
const CURRENCIES: Currency[] = ["USD", "EUR", "UAH", "GBP"];
const formatters = Object.fromEntries(
  CURRENCIES.map((currency) => [
    currency,
    new Intl.NumberFormat("uk-UA", { style: "currency", currency }),
  ]),
) as Record<Currency, Intl.NumberFormat>;

const infoCards = [
  { title: "Можливості розміщення", items: ["Просування авто в пошуку", "Вигоди на ТОП до -45%", "Вигоди на публікації до -45%"] },
  { title: "Запчастини та аксесуари", items: ["Нові і б/у запчастини", "Шини та диски", "Гаражі по всій Україні"] },
  { title: "Підбір авто", items: ["Пошук перевірених авто", "Пошук нових авто", "Пошук з-за кордону"] },
  { title: "Сервіси VOLKSWAGEN", items: ["Пошук перевірених авто", "Перевірені авто на VOLKSWAGEN", "Офіційні тести з ПДР України"] },
  { title: "Автосалони", items: ["Автосалони всієї України", "Автодилери вживаних авто", "Авто під замовлення з-за кордону"] },
  { title: "Інструменти", items: ["Митний калькулятор", "Калькулятор середньої ціни", "СТО"] },
];

function formatPrice(amount: number, currency: Currency): string {
  return formatters[currency].format(amount);
}

function readSavedCart(): CartItem[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.flatMap((item): CartItem[] => {
      if (!item || !Number.isInteger(item.id) || !Number.isInteger(item.qty) || item.qty <= 0) return [];
      const vehicle = products.find((entry) => entry.id === item.id);
      return vehicle ? [{ ...vehicle, qty: item.qty }] : [];
    });
  } catch (error) {
    console.warn("Не вдалося прочитати збережений кошик.", error);
    return [];
  }
}

function readSavedFavorites(): number[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return [...new Set(saved.filter((id): id is number => Number.isInteger(id) && products.some((car) => car.id === id)))];
  } catch (error) {
    console.warn("Не вдалося прочитати збережене обране.", error);
    return [];
  }
}

interface HeaderProps {
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  rateInfo: string;
  isFallback: boolean;
  cartCount: number;
  favoritesCount: number;
  onOpenCart: () => void;
}

function Header({ currency, onCurrencyChange, rateInfo, isFallback, cartCount, favoritesCount, onOpenCart }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header>
      <div className="content">
        <Link className="logo" to="/" aria-label="Volkswagen — головна">
          <img src={volkswagenLogo} alt="Логотип Volkswagen" width="75" height="54" />
        </Link>
        <button
          className="burger"
          type="button"
          aria-label={menuOpen ? "Закрити меню" : "Відкрити меню"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>
        <nav className={`menu${menuOpen ? " is-open" : ""}`} aria-label="Головне меню">
          <ul>
            <li><Link className="header-button" to="/" onClick={() => setMenuOpen(false)}>Каталог</Link></li>
            <li><a className="header-button" href="/#contacts" onClick={() => setMenuOpen(false)}>Контакти</a></li>
            <li><Link className="header-button" to="/credit" onClick={() => setMenuOpen(false)}>Кредит</Link></li>
            <li><Link className="header-button" to="/service" onClick={() => setMenuOpen(false)}>Сервіс</Link></li>
            <li><Link className="header-button" to="/favorites" onClick={() => setMenuOpen(false)}>Обране ({favoritesCount})</Link></li>
          </ul>
        </nav>
        <div className="header-actions">
          <div className="currency-panel-header">
            <label htmlFor="currencySelect">Валюта:</label>
            <select id="currencySelect" value={currency} onChange={(event) => onCurrencyChange(event.target.value as Currency)}>
              {CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}
            </select>
            <span id="rateInfo" className={isFallback ? "is-fallback" : ""} role="status">{rateInfo}</span>
          </div>
          <button className="header-cart-button" type="button" aria-label="Відкрити кошик" onClick={onOpenCart}>
            <span aria-hidden="true">🛒</span><span className="header-cart-text">Кошик</span>
            <span className="cart-badge" hidden={cartCount === 0}>{cartCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

interface ProductCardProps {
  product: Vehicle;
  currency: Currency;
  rates: Exchange["rates"];
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onAddToCart: (id: number) => void;
  onOpenImage: (vehicle: Vehicle) => void;
}

function ProductCard({ product, currency, rates, isFavorite, onToggleFavorite, onAddToCart, onOpenImage }: ProductCardProps) {
  const price = (product.priceUSD * rates.USD) / rates[currency];
  return (
    <article className="box">
      <div className="vehicle-card-image">
        <Link to={`/cars/${product.id}`} aria-label={`Деталі: ${product.title}`}>
          <img src={product.img} alt={product.title} loading="lazy" decoding="async" />
        </Link>
        <button
          className={`favorite-button${isFavorite ? " is-favorite" : ""}`}
          type="button"
          aria-label={isFavorite ? "Видалити з обраного" : "Додати до обраного"}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(product.id)}
        >{isFavorite ? "♥" : "♡"}</button>
      </div>
      <Link className="vehicle-title" to={`/cars/${product.id}`}><h2>{product.title}</h2></Link>
      <p className="vehicle-meta">{product.year} р. · {product.mileageKm.toLocaleString("uk-UA")} км · {product.transmission}</p>
      <p className="price">{formatPrice(price, currency)}</p>
      <div className="vehicle-card-actions">
        <Link className="secondary-button" to={`/cars/${product.id}`}>Детальніше</Link>
        <button type="button" onClick={() => onAddToCart(product.id)}>До кошика</button>
      </div>
      <button className="image-preview-link" type="button" onClick={() => onOpenImage(product)}>Переглянути фото</button>
    </article>
  );
}

interface CatalogProps {
  currency: Currency;
  rates: Exchange["rates"];
  favorites: number[];
  onToggleFavorite: (id: number) => void;
  onAddToCart: (id: number) => void;
  onOpenImage: (vehicle: Vehicle) => void;
}

function Catalog({ currency, rates, favorites, onToggleFavorite, onAddToCart, onOpenImage }: CatalogProps) {
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState("all");
  const [body, setBody] = useState("all");
  const [sort, setSort] = useState<VehicleSort>("recommended");
  const visibleVehicles = useMemo(() => filterAndSortVehicles(products, {
    query,
    maxPrice: maxPrice === "all" ? null : Number(maxPrice),
    body,
    sort,
  }), [query, maxPrice, body, sort]);

  return (
    <main>
      <section className="promo-hero" aria-label="Автомобілі з пробігом Volkswagen">
        <h1>Автомобілі з пробігом Volkswagen</h1>
        <p>Перевірені авто. Надійні угоди. Вигідні ціни.</p>
      </section>
      <section className="catalog-section" aria-label="Каталог автомобілів">
        <div className="catalog-toolbar">
          <label>Пошук автомобіля
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Наприклад, Tiguan" />
          </label>
          <label>Максимальна ціна
            <select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}>
              <option value="all">Будь-яка</option>
              <option value="13000">До $13 000</option>
              <option value="17000">До $17 000</option>
              <option value="20000">До $20 000</option>
            </select>
          </label>
          <label>Тип кузова
            <select value={body} onChange={(event) => setBody(event.target.value)}>
              <option value="all">Усі кузови</option>
              {["Кросовер", "Седан", "Хетчбек", "Універсал"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>Сортування
            <select value={sort} onChange={(event) => setSort(event.target.value as VehicleSort)}>
              <option value="recommended">Рекомендовані</option>
              <option value="price-asc">Спочатку дешевші</option>
              <option value="price-desc">Спочатку дорожчі</option>
              <option value="year-desc">Спочатку новіші</option>
            </select>
          </label>
        </div>
        <p className="results-count" role="status">Знайдено автомобілів: {visibleVehicles.length}</p>
        {visibleVehicles.length === 0 ? (
          <p className="empty-results">За вибраними параметрами автомобілів не знайдено.</p>
        ) : (
          <div className="main-content">
            {visibleVehicles.map((vehicle) => (
              <ProductCard
                key={vehicle.id}
                product={vehicle}
                currency={currency}
                rates={rates}
                isFavorite={favorites.includes(vehicle.id)}
                onToggleFavorite={onToggleFavorite}
                onAddToCart={onAddToCart}
                onOpenImage={onOpenImage}
              />
            ))}
          </div>
        )}
      </section>
      <InfoCards />
    </main>
  );
}

function InfoCards() {
  return (
    <section className="grid-container">
      {infoCards.map(({ title, items }) => (
        <div className="grid-item" key={title}>
          <h2>{title}</h2><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      ))}
    </section>
  );
}

function VehicleDetails({ currency, rates, onToggleFavorite, favorites, onAddToCart, onOpenImage }: CatalogProps) {
  const { id } = useParams();
  const vehicle = products.find((item) => item.id === Number(id));
  if (!vehicle) return <NotFound />;
  const price = (vehicle.priceUSD * rates.USD) / rates[currency];

  return (
    <main className="page-shell">
      <nav className="breadcrumbs" aria-label="Навігаційний ланцюжок">
        <Link to="/">Каталог</Link><span aria-hidden="true"> / </span><span>{vehicle.title}</span>
      </nav>
      <article className="vehicle-details">
        <div className="vehicle-details-photo">
          <button type="button" onClick={() => onOpenImage(vehicle)} aria-label="Збільшити фото">
            <img src={vehicle.img} alt={vehicle.title} />
          </button>
        </div>
        <div className="vehicle-details-info">
          <h1>{vehicle.title}</h1>
          <p className="details-price">{formatPrice(price, currency)}</p>
          <dl className="vehicle-specs">
            <div><dt>Рік випуску</dt><dd>{vehicle.year}</dd></div>
            <div><dt>Пробіг</dt><dd>{vehicle.mileageKm.toLocaleString("uk-UA")} км</dd></div>
            <div><dt>Пальне</dt><dd>{vehicle.fuel}</dd></div>
            <div><dt>Коробка передач</dt><dd>{vehicle.transmission}</dd></div>
            <div><dt>Тип кузова</dt><dd>{vehicle.body}</dd></div>
          </dl>
          <p className="sample-data-note">Демонстраційна пропозиція. Характеристики автомобіля уточнюйте у менеджера.</p>
          <div className="vehicle-detail-actions">
            <button type="button" onClick={() => onAddToCart(vehicle.id)}>Додати до кошика</button>
            <button
              className="secondary-button"
              type="button"
              aria-pressed={favorites.includes(vehicle.id)}
              onClick={() => onToggleFavorite(vehicle.id)}
            >{favorites.includes(vehicle.id) ? "♥ В обраному" : "♡ До обраного"}</button>
          </div>
          <ApplicationForm vehicle={vehicle.title} />
        </div>
      </article>
    </main>
  );
}

function FavoritesPage(props: CatalogProps) {
  const favoriteVehicles = products.filter((vehicle) => props.favorites.includes(vehicle.id));
  return (
    <main className="page-shell">
      <h1>Обрані автомобілі</h1>
      {favoriteVehicles.length === 0 ? (
        <div className="empty-results"><p>У вас ще немає обраних автомобілів.</p><Link className="primary-button" to="/">Перейти до каталогу</Link></div>
      ) : (
        <div className="main-content">
          {favoriteVehicles.map((vehicle) => (
            <ProductCard
              key={vehicle.id}
              product={vehicle}
              currency={props.currency}
              rates={props.rates}
              isFavorite
              onToggleFavorite={props.onToggleFavorite}
              onAddToCart={props.onAddToCart}
              onOpenImage={props.onOpenImage}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function CreditPage() {
  const [vehiclePrice, setVehiclePrice] = useState(20_000);
  const [downPayment, setDownPayment] = useState(30);
  const [annualRate, setAnnualRate] = useState(12);
  const [term, setTerm] = useState(36);
  const calculation = calculateCredit(vehiclePrice, downPayment, annualRate, term);
  const formatUsd = (amount: number) => formatPrice(amount, "USD");

  return (
    <main className="page-shell">
      <section className="credit-layout">
        <div className="credit-calculator">
          <h1>Кредитний калькулятор</h1>
          <p>Орієнтовний розрахунок щомісячного платежу.</p>
          <label>Вартість автомобіля: <strong>{formatUsd(vehiclePrice)}</strong>
            <input type="range" min="5000" max="50000" step="500" value={vehiclePrice} onChange={(event) => setVehiclePrice(Number(event.target.value))} />
          </label>
          <label>Перший внесок: <strong>{downPayment}%</strong>
            <input type="range" min="10" max="70" step="5" value={downPayment} onChange={(event) => setDownPayment(Number(event.target.value))} />
          </label>
          <label>Річна ставка: <strong>{annualRate}%</strong>
            <input type="range" min="0" max="30" step="0.5" value={annualRate} onChange={(event) => setAnnualRate(Number(event.target.value))} />
          </label>
          <label>Термін кредиту: <strong>{term} місяців</strong>
            <input type="range" min="12" max="84" step="12" value={term} onChange={(event) => setTerm(Number(event.target.value))} />
          </label>
          <dl className="credit-results">
            <div><dt>Сума кредиту</dt><dd>{formatUsd(calculation.principal)}</dd></div>
            <div><dt>Щомісячний платіж</dt><dd>{formatUsd(calculation.monthlyPayment)}</dd></div>
            <div><dt>Загальна сума виплат</dt><dd>{formatUsd(calculation.totalPayment)}</dd></div>
            <div><dt>Переплата</dt><dd>{formatUsd(calculation.overpayment)}</dd></div>
          </dl>
          <p className="sample-data-note">Розрахунок орієнтовний, не є пропозицією кредитування. Фактичні умови визначає банк.</p>
        </div>
        <ApplicationForm vehicle="Заявка на кредит" message={`Авто: ${formatUsd(vehiclePrice)}; перший внесок: ${downPayment}%; строк: ${term} міс.; орієнтовна ставка: ${annualRate}%.`} />
      </section>
    </main>
  );
}

function ServicePage() {
  return (
    <main className="page-shell service-page">
      <section className="service-hero">
        <h1>Технічне обслуговування авто</h1>
        <p>Швидко, якісно, з гарантією.</p>
        <a className="primary-button" href="tel:+380686363845">Зателефонувати: +38 (068) 636-38-45</a>
      </section>
      <InfoCards />
    </main>
  );
}

function NotFound() {
  return <main className="page-shell"><h1>Сторінку не знайдено</h1><Link to="/">Повернутися до каталогу</Link></main>;
}

interface CartDrawerProps {
  cart: CartItem[];
  currency: Currency;
  rates: Exchange["rates"];
  isOpen: boolean;
  onClose: () => void;
  onChangeQuantity: (id: number, amount: number) => void;
  onRemove: (id: number) => void;
  onCheckout: () => void;
}

function CartDrawer({ cart, currency, rates, isOpen, onClose, onChangeQuantity, onRemove, onCheckout }: CartDrawerProps) {
  const total = cart.reduce((sum, item) => sum + (item.priceUSD * rates.USD) / rates[currency] * item.qty, 0);
  return (
    <>
      <div className={`cart-overlay${isOpen ? " is-visible" : ""}`} aria-hidden={!isOpen} onClick={onClose} />
      <aside className={`cart-drawer${isOpen ? " is-open" : ""}`} aria-label="Кошик" aria-hidden={!isOpen}>
        <div className="cart-drawer-header">
          <h2>🛒 Кошик</h2>
          <button className="close-cart-button" type="button" aria-label="Закрити кошик" onClick={onClose}>Закрити</button>
        </div>
        {cart.length === 0 ? (
          <div className="cart-empty-state"><p>Ваш кошик порожній</p><button className="secondary-button" type="button" onClick={onClose}>Перейти до покупок</button></div>
        ) : (
          <div className="cart-content">
            <ul id="cartItems">
              {cart.map((item) => {
                const itemPrice = (item.priceUSD * rates.USD) / rates[currency];
                return (
                  <li className="cart-item" key={item.id}>
                    <img className="cart-item-image" src={item.img} alt={item.title} />
                    <div className="cart-item-main">
                      <div className="cart-item-top"><h3 className="cart-item-title">{item.title}</h3>
                        <button className="remove-item-button" type="button" aria-label={`Видалити ${item.title}`} onClick={() => onRemove(item.id)}>×</button>
                      </div>
                      <div className="cart-item-price">{formatPrice(itemPrice, currency)}</div>
                      <div className="cart-item-actions">
                        <div className="quantity-control">
                          <button className="qty-button" type="button" aria-label="Зменшити кількість" onClick={() => onChangeQuantity(item.id, -1)}>−</button>
                          <span className="qty-value">{item.qty}</span>
                          <button className="qty-button" type="button" aria-label="Збільшити кількість" onClick={() => onChangeQuantity(item.id, 1)}>+</button>
                        </div>
                        <strong className="cart-item-total">{formatPrice(itemPrice * item.qty, currency)}</strong>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="cart-footer">
              <div className="cart-total-row"><span>Разом:</span><strong>{formatPrice(total, currency)}</strong></div>
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
        <div className="footer-text"><p>&copy; 2026 Volkswagen. Усі права захищено.</p><p>Пошта: vw.autoshop.ua@gmail.com</p></div>
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
  const [currency, setCurrency] = useState<Currency>("USD");
  const [exchange, setExchange] = useState<Exchange>({ rates: FALLBACK_RATES, isFallback: false, isLoading: true });
  const [cart, setCart] = useState<CartItem[]>(readSavedCart);
  const [favorites, setFavorites] = useState<number[]>(readSavedFavorites);
  const [cartOpen, setCartOpen] = useState(false);
  const [viewedImage, setViewedImage] = useState<Vehicle | null>(null);

  useEffect(() => {
    let active = true;
    async function loadRates() {
      try {
        const response = await fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json");
        if (!response.ok) throw new Error(`NBU API returned HTTP ${response.status}`);
        const data: Array<{ cc?: string; rate?: number }> = await response.json();
        const rates: Partial<Exchange["rates"]> = { UAH: 1 };
        data.forEach((item) => {
          const rate = Number(item.rate);
          if (item.cc && Number.isFinite(rate) && rate > 0 && CURRENCIES.includes(item.cc as Currency)) {
            rates[item.cc as Currency] = rate;
          }
        });
        if (!rates.USD || !rates.EUR || !rates.GBP) throw new Error("NBU response is missing a supported currency rate");
        if (active) setExchange({ rates: rates as Exchange["rates"], isFallback: false, isLoading: false });
      } catch (error) {
        console.warn("Не вдалося завантажити курси НБУ. Використовуються резервні курси.", error);
        if (active) setExchange({ rates: FALLBACK_RATES, isFallback: true, isLoading: false });
      }
    }
    void loadRates();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (cart.length === 0) localStorage.removeItem(CART_STORAGE_KEY);
    else localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (favorites.length === 0) localStorage.removeItem(FAVORITES_STORAGE_KEY);
    else localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCartOpen(false);
        setViewedImage(null);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const rateInfo = exchange.isLoading ? "" : exchange.isFallback
    ? "НБУ недоступний — резервні курси"
    : currency === "UAH"
      ? `Курс НБУ: 1 USD = ${exchange.rates.USD.toFixed(2)} UAH`
      : `Орієнтовно: 1 USD ≈ ${(exchange.rates.USD / exchange.rates[currency]).toFixed(4)} ${currency}`;

  function addToCart(id: number) {
    const vehicle = products.find((item) => item.id === id);
    if (!vehicle) return;
    setCart((current) => {
      const existing = current.find((item) => item.id === id);
      return existing
        ? current.map((item) => item.id === id ? { ...item, qty: item.qty + 1 } : item)
        : [...current, { ...vehicle, qty: 1 }];
    });
  }

  function changeQuantity(id: number, amount: number) {
    setCart((current) => current.map((item) => item.id === id ? { ...item, qty: item.qty + amount } : item).filter((item) => item.qty > 0));
  }

  function checkout() {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + (item.priceUSD * exchange.rates.USD) / exchange.rates[currency] * item.qty, 0);
    window.alert(`Замовлення оформлено! Сума: ${formatPrice(total, currency)}`);
    setCart([]);
    setCartOpen(false);
  }

  function toggleFavorite(id: number) {
    setFavorites((current) => current.includes(id) ? current.filter((favorite) => favorite !== id) : [...current, id]);
  }

  const catalogProps: CatalogProps = {
    currency,
    rates: exchange.rates,
    favorites,
    onToggleFavorite: toggleFavorite,
    onAddToCart: addToCart,
    onOpenImage: setViewedImage,
  };
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <>
      <Header
        currency={currency}
        onCurrencyChange={setCurrency}
        rateInfo={rateInfo}
        isFallback={exchange.isFallback}
        cartCount={cartCount}
        favoritesCount={favorites.length}
        onOpenCart={() => setCartOpen(true)}
      />
      <CartDrawer
        cart={cart}
        currency={currency}
        rates={exchange.rates}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onChangeQuantity={changeQuantity}
        onRemove={(id) => setCart((current) => current.filter((item) => item.id !== id))}
        onCheckout={checkout}
      />
      <Routes>
        <Route path="/" element={<Catalog {...catalogProps} />} />
        <Route path="/cars/:id" element={<VehicleDetails {...catalogProps} />} />
        <Route path="/favorites" element={<FavoritesPage {...catalogProps} />} />
        <Route path="/credit" element={<CreditPage />} />
        <Route path="/service" element={<ServicePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {viewedImage && (
        <div className="image-viewer-overlay is-open" onClick={(event) => {
          if (event.target === event.currentTarget) setViewedImage(null);
        }}>
          <div className="image-viewer" role="dialog" aria-modal="true" aria-label={`Фото: ${viewedImage.title}`}>
            <button className="image-viewer-close" type="button" aria-label="Закрити збільшене фото" onClick={() => setViewedImage(null)}>×</button>
            <img src={viewedImage.img} alt={viewedImage.title} />
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}
