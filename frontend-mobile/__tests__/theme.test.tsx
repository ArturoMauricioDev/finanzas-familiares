import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import * as SecureStore from "expo-secure-store";

import { ThemeProvider, useTheme } from "../components/providers/ThemeProvider";
import { setThemePreference } from "../lib/preferences";

const store = SecureStore as unknown as { __clear: () => void };

function Probe() {
  const theme = useTheme();
  return (
    <>
      <Text testID="mode">{theme.mode}</Text>
      <Text testID="resolved">{theme.resolved}</Text>
      <Pressable accessibilityRole="button" onPress={() => theme.setMode("dark")}>
        <Text>Oscuro</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => theme.setMode("system")}>
        <Text>Sistema</Text>
      </Pressable>
    </>
  );
}

beforeEach(() => {
  store.__clear();
});

describe("mobile theme provider", () => {
  it("applies a stored theme on load", async () => {
    await setThemePreference("dark");

    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("mode").props.children).toBe("dark"));
    expect(screen.getByTestId("resolved").props.children).toBe("dark");
  });

  it("changes the theme on demand and persists it", async () => {
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("mode").props.children).toBe("system"));
    await fireEvent.press(screen.getByText("Oscuro"));

    await waitFor(() => expect(screen.getByTestId("mode").props.children).toBe("dark"));
    await waitFor(async () =>
      expect(await SecureStore.getItemAsync("kitho_theme")).toBe("dark"),
    );
  });

  it("returns to the system preference", async () => {
    await setThemePreference("dark");

    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("mode").props.children).toBe("dark"));
    await fireEvent.press(screen.getByText("Sistema"));

    await waitFor(() => expect(screen.getByTestId("mode").props.children).toBe("system"));
    await waitFor(async () =>
      expect(await SecureStore.getItemAsync("kitho_theme")).toBe("system"),
    );
  });
});