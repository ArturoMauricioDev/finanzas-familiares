import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import * as SecureStore from "expo-secure-store";

import { LocaleProvider, useI18n } from "../components/providers/LocaleProvider";
import { setLocalePreference } from "../lib/preferences";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en", regionCode: "US" }],
}));

const store = SecureStore as unknown as { __clear: () => void };

function Probe() {
  const { formatLocale, locale, setLocale, t } = useI18n();
  return (
    <>
      <Text testID="locale">{locale}</Text>
      <Text testID="formatLocale">{formatLocale}</Text>
      <Text testID="home">{t("nav.home")}</Text>
      <Text testID="error">{t("errors.details.invitationExpired")}</Text>
      <Pressable accessibilityRole="button" onPress={() => setLocale("en")}>
        <Text>English</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => setLocale("es")}>
        <Text>Español</Text>
      </Pressable>
    </>
  );
}

beforeEach(() => {
  store.__clear();
});

describe("mobile locale provider", () => {
  it("keeps Spanish when the device language is English", async () => {
    await render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("home").props.children).toBe("Inicio"));
    expect(screen.getByTestId("locale").props.children).toBe("es");
    expect(screen.getByTestId("formatLocale").props.children).toBe("es-US");
  });

  it("uses a stored Spanish preference", async () => {
    await setLocalePreference("es");

    await render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("home").props.children).toBe("Inicio"));
    expect(screen.getByTestId("locale").props.children).toBe("es");
  });

  it("changes language and persists it", async () => {
    await setLocalePreference("es");

    await render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("home").props.children).toBe("Inicio"));
    await fireEvent.press(screen.getByText("English"));

    await waitFor(() => expect(screen.getByTestId("home").props.children).toBe("Home"));
    expect(screen.getByTestId("error").props.children).toBe("This invitation expired.");
    expect(await SecureStore.getItemAsync("kitho_locale")).toBe("en");
  });
});