import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ThemeProvider, useTheme } from "../components/providers/ThemeProvider";

function Probe() {
  const theme = useTheme();
  return (
    <div>
      <span data-testid="mode">{theme.mode}</span>
      <span data-testid="resolved">{theme.resolved}</span>
      <button type="button" onClick={() => theme.setMode("dark")}>
        Cambiar a oscuro
      </button>
      <button type="button" onClick={() => theme.setMode("system")}>
        Usar sistema
      </button>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("web theme provider", () => {
  it("applies a stored dark theme without waiting for a toggle", async () => {
    window.localStorage.setItem("kitho_theme", "dark");

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("resolved")).toHaveTextContent("dark"));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
  });

  it("changes the theme on demand and persists it", async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cambiar a oscuro" }));

    await waitFor(() => expect(screen.getByTestId("mode")).toHaveTextContent("dark"));
    expect(window.localStorage.getItem("kitho_theme")).toBe("dark");
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
  });

  it("returns to the system preference", async () => {
    window.localStorage.setItem("kitho_theme", "dark");

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("mode")).toHaveTextContent("dark"));
    fireEvent.click(screen.getByRole("button", { name: "Usar sistema" }));

    await waitFor(() => expect(screen.getByTestId("mode")).toHaveTextContent("system"));
    expect(window.localStorage.getItem("kitho_theme")).toBe("system");
  });
});