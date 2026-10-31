import { describe, expect, it } from "vitest";
import { validateApplication } from "../server/validation";

describe("validateApplication", () => {
  it("accepts a valid application", () => {
    expect(validateApplication({
      name: "Олег",
      phone: "+380501234567",
      vehicle: "Volkswagen Golf",
      message: "",
      website: "",
    })).toMatchObject({ valid: true });
  });

  it("rejects malformed or bot-filled requests", () => {
    expect(validateApplication({ name: "A", phone: "12", vehicle: "", website: "" })).toMatchObject({ valid: false });
    expect(validateApplication({ name: "Олег", phone: "+380501234567", vehicle: "Golf", website: "spam" })).toMatchObject({ valid: false });
  });
});
