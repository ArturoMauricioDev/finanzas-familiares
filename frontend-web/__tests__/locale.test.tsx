import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { LocaleProvider, useI18n } from "../components/providers/LocaleProvider";

function Probe() {
  const { formatLocale, locale, setLocale, t } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="formatLocale">{formatLocale}</span>
      <span data-testid="home">{t("nav.home")}</span>
      <span data-testid="error">{t("errors.details.invitationExpired")}</span>
      <span data-testid="version">{t("settings.version", { version: "1.2.3" })}</span>
      <button type="button" onClick={() => setLocale("en")}>
        English
      </button>
      <button type="button" onClick={() => setLocale("es")}>
        Español
      </button>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.cookie = "kitho_locale=; path=/; max-age=0";
  document.documentElement.lang = "es";
  Object.defineProperty(window.navigator, "language", {
    configurable: true,
    value: "en-US",
  });
});

describe("web locale provider", () => {
  it("defaults to Spanish", async () => {
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("es");
    expect(screen.getByTestId("home")).toHaveTextContent("Inicio");
    expect(screen.getByTestId("version")).toHaveTextContent("Versión 1.2.3");
    await waitFor(() =>
      expect(screen.getByTestId("formatLocale")).toHaveTextContent("es-US"),
    );
  });

  it("changes language without reloading and persists the choice", async () => {
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    await waitFor(() => expect(screen.getByTestId("home")).toHaveTextContent("Home"));
    expect(screen.getByTestId("error")).toHaveTextContent("This invitation expired.");
    expect(screen.getByTestId("version")).toHaveTextContent("Version 1.2.3");
    expect(window.localStorage.getItem("kitho_locale")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toBe("Kitho Family");
    expect(screen.getByTestId("formatLocale")).toHaveTextContent("en-US");
  });

  it("restores a stored language preference", async () => {
    window.localStorage.setItem("kitho_locale", "en");

    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("locale")).toHaveTextContent("en"));
    expect(screen.getByTestId("home")).toHaveTextContent("Home");
  });
});