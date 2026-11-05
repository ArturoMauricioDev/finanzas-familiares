import { fireEvent, render, screen } from "@testing-library/react";

import { AvatarEditor } from "../components/ui/AvatarEditor";

describe("web avatar editor", () => {
  it("renders the preview and every customization control", () => {
    render(<AvatarEditor seed="user-1" />);

    expect(screen.getByAltText("Vista previa del avatar")).toBeInTheDocument();
    for (const label of [
      "Tono de piel",
      "Cabello",
      "Color de cabello",
      "Ropa",
      "Ojos",
      "Barba",
      "Accesorio",
      "Expresión",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(
      screen.getByText("Vista previa únicamente. No se guardará en el perfil."),
    ).toBeInTheDocument();
  });

  it("updates the preview immediately when an option changes", () => {
    render(<AvatarEditor seed="user-1" />);
    const preview = screen.getByAltText("Vista previa del avatar");
    const before = preview.getAttribute("src");

    fireEvent.change(screen.getByLabelText("Cabello"), { target: { value: "0" } });

    expect(preview.getAttribute("src")).not.toBe(before);
  });

  it("randomizes the avatar configuration", () => {
    render(<AvatarEditor seed="user-1" />);
    const preview = screen.getByAltText("Vista previa del avatar");
    const before = preview.getAttribute("src");

    fireEvent.click(screen.getByRole("button", { name: "Sorpréndeme" }));

    expect(preview.getAttribute("src")).not.toBe(before);
  });

  it("hands the preview data URI to the apply callback without persisting", () => {
    const onApply = jest.fn();
    render(<AvatarEditor seed="user-1" onApply={onApply} />);

    fireEvent.click(screen.getByRole("button", { name: "Usar este avatar" }));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0]).toMatch(/^data:image\/svg\+xml,/);
  });

  it("shows the spec 003 notice when saving without persisting", () => {
    const onApply = jest.fn();
    render(<AvatarEditor seed="user-1" onApply={onApply} />);

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByText(/se guardará en una próxima versión/i)).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });
});