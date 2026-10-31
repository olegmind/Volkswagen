import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

describe("React Router pages", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { cc: "USD", rate: 40 },
        { cc: "EUR", rate: 43 },
        { cc: "GBP", rate: 50 },
      ],
    }));
  });

  it("renders a car detail page for a direct route", async () => {
    render(<MemoryRouter initialEntries={["/cars/1"]}><App /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Volkswagen Tiguan" })).toBeInTheDocument();
    expect(screen.getByText("Рік випуску")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Залишити заявку" })).toBeInTheDocument();
  });

  it("searches the catalog and toggles a vehicle favorite", async () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    fireEvent.change(screen.getByRole("searchbox", { name: "Пошук автомобіля" }), { target: { value: "Tiguan" } });
    expect(screen.getAllByRole("heading", { name: "Volkswagen Tiguan" }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "Додати до обраного" })[0]);
    expect(screen.getByRole("link", { name: "Обране (1)" })).toBeInTheDocument();
  });

  it("renders the credit calculator route", () => {
    render(<MemoryRouter initialEntries={["/credit"]}><App /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Кредитний калькулятор" })).toBeInTheDocument();
    expect(screen.getByText("Щомісячний платіж")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("slider", { name: /Вартість автомобіля/ }), { target: { value: "25000" } });
    expect(screen.getByLabelText("Коментар")).toHaveValue(
      "Авто: 25\u00a0000,00\u00a0USD; перший внесок: 30%; строк: 36 міс.; орієнтовна ставка: 12%.",
    );
  });
});
