import { translateApiError } from "../lib/errors";

describe("mobile translateApiError", () => {
  it("translates known backend details", () => {
    expect(translateApiError(400, "User already belongs to a family")).toBe(
      "Ya perteneces a un grupo familiar.",
    );
    expect(translateApiError(403, "Only admins can manage members")).toBe(
      "Solo los administradores pueden gestionar integrantes.",
    );
    expect(translateApiError(400, "Family has reached maximum member limit")).toBe(
      "El grupo alcanzó el límite de 10 integrantes.",
    );
  });

  it("falls back to a Spanish status message for validation payloads", () => {
    expect(translateApiError(422, ["nombre: Field required"])).toBe(
      "Revisa los datos ingresados e inténtalo de nuevo.",
    );
  });

  it("never exposes an unknown technical detail", () => {
    expect(translateApiError(500, "database connection reset")).toBe(
      "Ocurrió un error inesperado. Inténtalo de nuevo.",
    );
  });
});
