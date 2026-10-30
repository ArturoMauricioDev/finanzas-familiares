import { translateApiError } from "../lib/errors";

describe("translateApiError", () => {
  it("translates known backend details", () => {
    expect(translateApiError(400, "User already belongs to a family")).toBe(
      "Ya perteneces a un grupo familiar.",
    );
    expect(translateApiError(403, "Only admins can create invitations")).toBe(
      "Solo los administradores pueden generar invitaciones.",
    );
    expect(translateApiError(400, "Invitation expired")).toBe(
      "Esta invitación ha expirado.",
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
