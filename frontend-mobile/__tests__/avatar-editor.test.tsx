import { fireEvent, render, screen } from "@testing-library/react-native";

import { AvatarEditor } from "../components/ui/AvatarEditor";

describe("mobile avatar editor", () => {
  it("renders the preview, the save notice and every control", async () => {
    await render(<AvatarEditor seed="user-1" />);

    expect(screen.getByText("Vista previa únicamente. No se guardará en el perfil.")).toBeTruthy();
    for (const label of [
      "Color de fondo",
      "Tono de piel",
      "Cabello",
      "Color de cabello",
      "Ropa",
      "Ojos",
      "Barba",
      "Accesorio",
      "Expresión",
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it("randomizes the preview immediately", async () => {
    await render(<AvatarEditor seed="user-1" />);
    const selectedLabels = () =>
      screen
        .getAllByRole("button")
        .filter((element) => element.props.accessibilityState?.selected)
        .map((element) => element.props.accessibilityLabel);
    const before = selectedLabels();

    await fireEvent.press(screen.getByText("Sorpréndeme"));

    expect(selectedLabels()).not.toEqual(before);
  });

  it("hands the preview data URI to the apply callback", async () => {
    const onApply = jest.fn();
    await render(<AvatarEditor seed="user-1" onApply={onApply} />);

    await fireEvent.press(screen.getByText("Usar este avatar"));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0]).toMatch(/^data:image\/svg\+xml,/);
  });

  it("shows the spec 003 notice when saving without persisting", async () => {
    const onApply = jest.fn();
    await render(<AvatarEditor seed="user-1" onApply={onApply} />);

    await fireEvent.press(screen.getByText("Guardar"));

    expect(screen.getByText(/se guardará en una próxima versión/i)).toBeTruthy();
    expect(onApply).not.toHaveBeenCalled();
  });
});