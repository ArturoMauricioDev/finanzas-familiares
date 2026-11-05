import {
  ApiError,
  ConfigurationError,
  errorText,
  resolveError,
  translateApiError,
} from "../lib/errors";

const dictionary: Record<string, string> = {
  "errors.details.userAlreadyInFamily": "Ya perteneces a un grupo familiar.",
  "errors.details.adminOnlyInvitations": "Solo los administradores pueden generar invitaciones.",
  "errors.details.invitationExpired": "Esta invitación ha expirado.",
  "errors.status.409": "La acción entra en conflicto con el estado actual. Actualiza e inténtalo de nuevo.",
  "errors.status.422": "Revisa los datos ingresados e inténtalo de nuevo.",
  "errors.status.500": "Ocurrió un error en el servidor. Inténtalo de nuevo.",
  "errors.details.missingWebApiUrl":
    "Falta configurar NEXT_PUBLIC_API_URL para conectar con el servidor.",
};

const translate = (key: string): string => dictionary[key] ?? key;

describe("resolveError", () => {
  it("maps known backend details to i18n keys", () => {
    expect(resolveError(400, "User already belongs to a family")).toEqual({
      status: 400,
      key: "errors.details.userAlreadyInFamily",
      fallback: "User already belongs to a family",
    });
    expect(resolveError(403, "Only admins can create invitations").key).toBe(
      "errors.details.adminOnlyInvitations",
    );
    expect(resolveError(400, "Invitation expired").key).toBe("errors.details.invitationExpired");
  });

  it("maps statuses without detail to the status key", () => {
    expect(resolveError(409)).toEqual({
      status: 409,
      key: "errors.status.409",
      fallback: "",
    });
  });

  it("falls back to the status key for array validation payloads", () => {
    expect(resolveError(422, ["nombre: Field required"])).toEqual({
      status: 422,
      key: "errors.status.422",
      fallback: "",
    });
  });

  it("keeps the status key and detail for unknown backend messages", () => {
    expect(resolveError(500, "database connection reset")).toEqual({
      status: 500,
      key: "errors.status.500",
      fallback: "database connection reset",
    });
  });
});

describe("errorText", () => {
  it("translates ApiError message keys at render time", () => {
    const error = new ApiError(
      400,
      "errors.details.userAlreadyInFamily",
      "User already belongs to a family",
    );
    expect(errorText(error, translate, "fallback")).toBe("Ya perteneces a un grupo familiar.");
  });

  it("falls back to the backend detail when there is no key", () => {
    const error = new ApiError(500, null, "database connection reset");
    expect(errorText(error, translate, "fallback")).toBe("database connection reset");
  });

  it("falls back to the status key when there is no detail", () => {
    const error = new ApiError(409, "errors.status.409");
    expect(errorText(error, translate, "fallback")).toBe(dictionary["errors.status.409"]);
  });

  it("translates configuration errors", () => {
    const error = new ConfigurationError("errors.details.missingWebApiUrl");
    expect(errorText(error, translate, "fallback")).toBe(
      dictionary["errors.details.missingWebApiUrl"],
    );
  });
});

describe("translateApiError", () => {
  it("returns the resolved key for known details", () => {
    expect(translateApiError(400, "User already belongs to a family")).toBe(
      "errors.details.userAlreadyInFamily",
    );
  });

  it("returns the status key for conflict responses", () => {
    expect(translateApiError(409)).toBe("errors.status.409");
  });

  it("returns the status key for validation payload arrays", () => {
    expect(translateApiError(422, ["nombre: Field required"])).toBe("errors.status.422");
  });

  it("returns the status key for unknown technical details", () => {
    expect(translateApiError(500, "database connection reset")).toBe("errors.status.500");
  });
});