import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";

import { LocaleProvider } from "../../components/providers/LocaleProvider";
import { ThemeProvider } from "../../components/providers/ThemeProvider";

export function renderWithProviders(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <LocaleProvider>{ui}</LocaleProvider>
    </ThemeProvider>,
  );
}