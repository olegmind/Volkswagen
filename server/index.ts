import "dotenv/config";
import express, { type Request, type Response } from "express";
import { validateApplication } from "./validation";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

export function createApp() {
  const app = express();
  const requestsByIp = new Map<string, { count: number; resetAt: number }>();
  app.use(express.json({ limit: "10kb" }));

  app.post("/api/applications", (request: Request, response: Response) => {
    const now = Date.now();
    const ip = request.ip || "unknown";
    const rateLimit = requestsByIp.get(ip);
    if (rateLimit && rateLimit.resetAt > now && rateLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
      response.status(429).json({ error: "Забагато заявок. Спробуйте пізніше." });
      return;
    }
    if (!rateLimit || rateLimit.resetAt <= now) requestsByIp.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    else rateLimit.count += 1;

    const validation = validateApplication(request.body);
    if (!validation.valid) {
      response.status(400).json({ error: validation.error });
      return;
    }

    const webhookValue = process.env.CRM_WEBHOOK_URL;
    if (!webhookValue) {
      response.status(503).json({ error: "Інтеграцію з CRM ще не налаштовано. Спробуйте пізніше." });
      return;
    }

    let webhook: URL;
    try {
      webhook = new URL(webhookValue);
    } catch {
      response.status(503).json({ error: "Адреса інтеграції з CRM некоректна." });
      return;
    }
    if (webhook.protocol !== "https:") {
      response.status(503).json({ error: "Адреса інтеграції з CRM має використовувати HTTPS." });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    void fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.CRM_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.CRM_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        ...validation.application,
        source: "volkswagen-website",
        submittedAt: new Date().toISOString(),
      }),
      signal: controller.signal,
    }).then((crmResponse) => {
      clearTimeout(timeout);
      if (!crmResponse.ok) {
        console.error(`CRM webhook returned HTTP ${crmResponse.status}.`);
        response.status(502).json({ error: "CRM не прийняла заявку. Спробуйте пізніше." });
        return;
      }
      response.status(200).json({ message: "Заявку передано до CRM." });
    }).catch((error: unknown) => {
      clearTimeout(timeout);
      console.error("Не вдалося передати заявку до CRM.", error);
      response.status(502).json({ error: "Не вдалося зв’язатися з CRM. Спробуйте пізніше." });
    });
  });

  app.use((error: unknown, _request: Request, response: Response, _next: express.NextFunction) => {
    if (error instanceof SyntaxError) {
      response.status(400).json({ error: "Некоректний формат запиту." });
      return;
    }
    console.error("Помилка API заявок.", error);
    response.status(500).json({ error: "Внутрішня помилка сервера." });
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT || 3001);
  createApp().listen(port, () => console.log(`API сервер запущено на порті ${port}.`));
}
