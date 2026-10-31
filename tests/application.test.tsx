import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ApplicationForm from "../src/components/ApplicationForm";

describe("ApplicationForm", () => {
  it("sends a valid application to the API and shows confirmation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Заявку надіслано." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ApplicationForm vehicle="Volkswagen Tiguan" />);

    fireEvent.change(screen.getByLabelText("Ім’я"), { target: { value: "Олена" } });
    fireEvent.change(screen.getByLabelText("Номер телефону"), { target: { value: "+380501234567" } });
    fireEvent.click(screen.getByRole("button", { name: "Надіслати заявку" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/applications",
      expect.objectContaining({ method: "POST" }),
    ));
    expect(await screen.findByText("Заявку успішно надіслано. Дякуємо!")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("shows a clear error if the API is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("API недоступний")));
    render(<ApplicationForm vehicle="Заявка на кредит" />);
    fireEvent.change(screen.getByLabelText("Ім’я"), { target: { value: "Олена" } });
    fireEvent.change(screen.getByLabelText("Номер телефону"), { target: { value: "+380501234567" } });
    fireEvent.click(screen.getByRole("button", { name: "Надіслати заявку" }));
    expect(await screen.findByText("API недоступний")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
