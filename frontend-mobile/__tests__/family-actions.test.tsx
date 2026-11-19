import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { FamilyActions } from "../components/family/FamilyActions";
import { useI18n } from "../components/providers/LocaleProvider";
import type { ErrorDescriptor } from "../lib/errors";

import { renderWithProviders } from "./helpers/renderWithProviders";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "es", regionCode: "ES" }],
}));

const deleteError: ErrorDescriptor = {
  status: 0,
  key: "family.deleteFamilyFailed",
  fallback: "",
  source: "api",
};

function LocaleToggle() {
  const { setLocale } = useI18n();
  return (
    <Pressable accessibilityRole="button" onPress={() => setLocale("en")}>
      <Text>English</Text>
    </Pressable>
  );
}

describe("mobile FamilyActions", () => {
  it("offers delete only when the family has one member", async () => {
    const onDelete = jest.fn();
    await renderWithProviders(
      <FamilyActions
        familyName="Familia Pérez"
        memberCount={1}
        onDelete={onDelete}
        onLeave={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Eliminar familia" })).toBeTruthy();
    expect(screen.queryByText("Abandonar familia")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Eliminar familia" }));
    expect(screen.getByText(/Se eliminará «Familia Pérez»/)).toBeTruthy();
    const buttons = screen.getAllByRole("button", { name: "Eliminar familia" });
    await fireEvent.press(buttons[buttons.length - 1]);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("offers leave and never delete when there is more than one member", async () => {
    const onLeave = jest.fn();
    await renderWithProviders(
      <FamilyActions
        familyName="Familia Pérez"
        memberCount={3}
        onDelete={jest.fn()}
        onLeave={onLeave}
      />,
    );

    expect(screen.queryByText("Eliminar familia")).toBeNull();
    expect(screen.getByRole("button", { name: "Abandonar familia" })).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Abandonar familia" }));
    expect(screen.getByText(/Dejarás de formar parte de «Familia Pérez»/)).toBeTruthy();
    const buttons = screen.getAllByRole("button", { name: "Abandonar familia" });
    await fireEvent.press(buttons[buttons.length - 1]);

    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("shows loading and error states", async () => {
    await renderWithProviders(
      <FamilyActions
        familyName="Familia Pérez"
        memberCount={1}
        loadingAction="delete"
        error={deleteError}
        onDelete={jest.fn()}
      />,
    );

    expect(screen.getByText("No se pudo eliminar la familia.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Eliminar familia" }).props.accessibilityState).toMatchObject({
      disabled: true,
      busy: true,
    });
  });

  it("re-translates a visible error when the language changes", async () => {
    await renderWithProviders(
      <>
        <LocaleToggle />
        <FamilyActions
          familyName="Familia Pérez"
          memberCount={1}
          error={deleteError}
          onDelete={jest.fn()}
        />
      </>,
    );

    expect(screen.getByText("No se pudo eliminar la familia.")).toBeTruthy();

    await fireEvent.press(screen.getByText("English"));

    await waitFor(() =>
      expect(screen.getByText("Could not delete the family.")).toBeTruthy(),
    );
  });
});