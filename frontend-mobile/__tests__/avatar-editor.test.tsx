import { fireEvent, render, screen } from "@testing-library/react-native";

import { AvatarEditor } from "../components/ui/AvatarEditor";

describe("mobile avatar editor", () => {
  it("renders the preview, the save notice and every control", () => {
    render(<AvatarEditor seed="user-1" />);

    expect(screen.getByText("Vista previa únicamente. No se guardará en el perfil.")).toBeTruthy();
    for (const label of [
      "Tono de piel",
      "Cabello",
      "Color de cabello",
      "Barba",
      "Accesorio",
      "Expresión",
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it("randomizes the preview immediately", () => {
    render(<AvatarEditor seed="user-1" />);
    const selectedLabels = () =>
      screen
        .getAllByRole("button")
        .filter((element) => element.props.accessibilityState?.selected)
        .map((element) => element.props.accessibilityLabel);
    const before = selectedLabels();

    fireEvent.press(screen.getByText("Sorpréndeme"));

    expect(selectedLabels()).not.toEqual(before);
  });

  it("hands the preview data URI to the apply callback", () => {
    const onApply = jest.fn();
    render(<AvatarEditor seed="user-1" onApply={onApply} />);

    fireEvent.press(screen.getByText("Usar este avatar"));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0]).toMatch(/^data:image\/svg\+xml,/);
  });
});