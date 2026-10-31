import type { ApplicationRequest } from "../src/types";

export type ApplicationValidation =
  | { valid: true; application: ApplicationRequest }
  | { valid: false; error: string };

export function validateApplication(input: unknown): ApplicationValidation {
  if (!input || typeof input !== "object") return { valid: false, error: "Некоректні дані заявки." };
  const data = input as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const phone = typeof data.phone === "string" ? data.phone.trim() : "";
  const vehicle = typeof data.vehicle === "string" ? data.vehicle.trim() : "";
  const message = typeof data.message === "string" ? data.message.trim() : "";
  const website = typeof data.website === "string" ? data.website.trim() : "";

  if (website) return { valid: false, error: "Некоректна заявка." };
  if (name.length < 2 || name.length > 80) return { valid: false, error: "Вкажіть ім’я (від 2 до 80 символів)." };
  if (!/^[+\d\s().-]{7,24}$/.test(phone) || phone.replace(/\D/g, "").length < 7) {
    return { valid: false, error: "Перевірте номер телефону." };
  }
  if (vehicle.length < 2 || vehicle.length > 120) return { valid: false, error: "Не вказано автомобіль або тему заявки." };
  if (message.length > 1000) return { valid: false, error: "Коментар має містити не більше 1000 символів." };

  return { valid: true, application: { name, phone, vehicle, message, website: "" } };
}
