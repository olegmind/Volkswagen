import { FormEvent, useEffect, useState } from "react";
import type { ApplicationRequest } from "../types";

interface ApplicationFormProps {
  vehicle: string;
  message?: string;
}

export default function ApplicationForm({ vehicle, message = "" }: ApplicationFormProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [comment, setComment] = useState(message);

  useEffect(() => {
    setComment(message);
  }, [message]);

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");
    setErrorMessage("");

    const formData = new FormData(form);
    const payload: ApplicationRequest = {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      vehicle,
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""),
    };

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Не вдалося надіслати заявку.");
      setStatus("sent");
      form.reset();
      setComment(message);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Не вдалося надіслати заявку.");
    }
  }

  return (
    <form className="application-form" onSubmit={submitApplication}>
      <h2>Залишити заявку</h2>
      <p>Менеджер зв’яжеться з вами, щоб відповісти на запитання.</p>
      <label>
        Ім’я
        <input name="name" autoComplete="name" minLength={2} maxLength={80} required />
      </label>
      <label>
        Номер телефону
        <input name="phone" type="tel" autoComplete="tel" maxLength={24} placeholder="+380..." required />
      </label>
      <label>
        Коментар
        <textarea name="message" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={3} />
      </label>
      <label className="website-field" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <button className="primary-button" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Надсилаємо…" : "Надіслати заявку"}
      </button>
      <p className="form-status" role="status" aria-live="polite">
        {status === "sent" && "Заявку успішно надіслано. Дякуємо!"}
        {status === "error" && errorMessage}
      </p>
    </form>
  );
}
