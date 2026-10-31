export type Currency = "USD" | "EUR" | "UAH" | "GBP";

export interface Vehicle {
  id: number;
  title: string;
  priceUSD: number;
  img: string;
  year: number;
  mileageKm: number;
  fuel: "Бензин" | "Дизель" | "Гібрид";
  transmission: "Автомат" | "Механіка";
  body: "Кросовер" | "Седан" | "Хетчбек" | "Універсал";
}

export interface CartItem extends Vehicle {
  qty: number;
}

export interface Exchange {
  rates: Record<Currency, number>;
  isFallback: boolean;
  isLoading: boolean;
}

export interface ApplicationRequest {
  name: string;
  phone: string;
  vehicle: string;
  message: string;
  website: string;
}
