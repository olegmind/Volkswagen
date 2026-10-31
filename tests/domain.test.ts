import { describe, expect, it } from "vitest";
import { products } from "../src/data/products";
import { calculateCredit } from "../src/domain/credit";
import { filterAndSortVehicles } from "../src/domain/vehicles";

describe("filterAndSortVehicles", () => {
  it("searches by model and filters by body and maximum price", () => {
    const results = filterAndSortVehicles(products, {
      query: " tiguan ",
      maxPrice: 17_000,
      body: "Кросовер",
      sort: "recommended",
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((vehicle) =>
      vehicle.title.toLocaleLowerCase("uk").includes("tiguan")
      && vehicle.body === "Кросовер"
      && vehicle.priceUSD <= 17_000)).toBe(true);
  });

  it("sorts prices from low to high", () => {
    const results = filterAndSortVehicles(products, {
      query: "",
      maxPrice: null,
      body: "all",
      sort: "price-asc",
    });

    expect(results[0].priceUSD).toBeLessThanOrEqual(results.at(-1)!.priceUSD);
  });
});

describe("calculateCredit", () => {
  it("calculates a zero-interest loan without overpayment", () => {
    expect(calculateCredit(12_000, 25, 0, 12)).toEqual({
      principal: 9_000,
      monthlyPayment: 750,
      totalPayment: 9_000,
      overpayment: 0,
    });
  });

  it("calculates a fixed-payment loan with a positive rate", () => {
    const result = calculateCredit(20_000, 25, 12, 36);
    expect(result.principal).toBe(15_000);
    expect(result.monthlyPayment).toBeCloseTo(498.21, 1);
    expect(result.overpayment).toBeGreaterThan(0);
  });
});
