import { fireEvent, screen } from "@testing-library/react-native";

import { FamilyActions } from "../components/family/FamilyActions";

import { renderWithProviders } from "./helpers/renderWithProviders";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "es", regionCode: "ES" }],
}));

describe("mobile FamilyActions", () => {
  it("offers delete only when the family has one member", async () => {
    const onDelete = jest.fn();
    await renderWithProviders(
      <FamilyActions memberCount={1} onDelete={onDelete} onLeave={jest.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Eliminar familia" })).toBeTruthy();
    expect(screen.queryByText("Abandonar familia")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Eliminar familia" }));
    const buttons = screen.getAllByRole("button", { name: "Eliminar familia" });
    await fireEvent.press(buttons[buttons.length - 1]);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("offers leave and never delete when there is more than one member", async () => {
    const onLeave = jest.fn();
    await renderWithProviders(
      <FamilyActions memberCount={3} onDelete={jest.fn()} onLeave={onLeave} />,
    );

    expect(screen.queryByText("Eliminar familia")).toBeNull();
    expect(screen.getByRole("button", { name: "Abandonar familia" })).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Abandonar familia" }));
    const buttons = screen.getAllByRole("button", { name: "Abandonar familia" });
    await fireEvent.press(buttons[buttons.length - 1]);

    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("shows loading and error states", async () => {
    await renderWithProviders(
      <FamilyActions
        memberCount={1}
        loadingAction="delete"
        error="No se pudo eliminar la familia."
        onDelete={jest.fn()}
      />,
    );

    expect(screen.getByText("No se pudo eliminar la familia.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Eliminar familia" }).props.accessibilityState).toMatchObject({
      disabled: true,
      busy: true,
    });
  });
});