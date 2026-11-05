import {
  ApiError,
  ConfigurationError,
  errorText,
  resolveError,
  translateApiError,
} from "../lib/errors";

const dictionary: Record<string, string> = {
  "errors.details.userAlreadyInFamily": "Ya perteneces a un grupo familiar.",
  "errors.details.adminOnlyMembers": "Solo los administradores pueden gestionar integrantes.",
  "errors.details.memberLimit": "El grupo alcanzó el límite de 10 integrantes.",
  "errors.status.409": "La acción entra en conflicto con el estado actual. Actualiza e inténtalo de nuevo.",
  "errors.status.422": "Revisa los datos ingresados e inténtalo de nuevo.",
  "errors.status.500": "Ocurrió un error en el servidor. Inténtalo de nuevo.",
  "errors.details.missingMobileApiUrl":
    "Falta configurar EXPO_PUBLIC_API_URL para conectar con el servidor.",
};

const translate = (key: string): string => dictionary[key] ?? key;

describe("mobile resolveError", () => {
  it("maps known backend details to i18n keys", () => {
    expect(resolveError(400, "User already belongs to a family")).toEqual({
      status: 400,
      key: "errors.details.userAlreadyInFamily",
      fallback: "User already belongs to a family",
    });
    expect(resolveError(403, "Only admins can manage members").key).toBe(
      "errors.details.adminOnlyMembers",
    );
    expect(resolveError(400, "Family has reached maximum member limit").key).toBe(
      "errors.details.memberLimit",
    );
  });

  it("maps statuses without detail to the status key", () => {
    expect(resolveError(409)).toEqual({ status: 409, key: "errors.status.409", fallback: "" });
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

describe("mobile errorText", () => {
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

  it("translates configuration errors", () => {
    const error = new ConfigurationError("errors.details.missingMobileApiUrl");
    expect(errorText(error, translate, "fallback")).toBe(
      dictionary["errors.details.missingMobileApiUrl"],
    );
  });
});

describe("mobile translateApiError", () => {
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