import type { Vehicle } from "../types";

export type VehicleSort = "recommended" | "price-asc" | "price-desc" | "year-desc";

export interface VehicleFilters {
  query: string;
  maxPrice: number | null;
  body: string;
  sort: VehicleSort;
}

export function filterAndSortVehicles(vehicles: Vehicle[], filters: VehicleFilters): Vehicle[] {
  const query = filters.query.trim().toLocaleLowerCase("uk");
  return vehicles
    .filter((vehicle) => !query || vehicle.title.toLocaleLowerCase("uk").includes(query))
    .filter((vehicle) => filters.maxPrice === null || vehicle.priceUSD <= filters.maxPrice)
    .filter((vehicle) => filters.body === "all" || vehicle.body === filters.body)
    .sort((a, b) => {
      switch (filters.sort) {
        case "price-asc":
          return a.priceUSD - b.priceUSD;
        case "price-desc":
          return b.priceUSD - a.priceUSD;
        case "year-desc":
          return b.year - a.year;
        default:
          return a.id - b.id;
      }
    });
}
