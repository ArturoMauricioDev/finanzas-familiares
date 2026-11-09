import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { InviteCode } from "../components/family/InviteCode";

import { renderWithProviders } from "./helpers/renderWithProviders";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "es", regionCode: "ES" }],
}));

const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

describe("mobile InviteCode", () => {
  it("shows only the grouped code and its single-use expiry", async () => {
    await renderWithProviders(
      <InviteCode
        code="ABCD1234"
        expiresAt={expiresAt}
        daysRemaining={7}
        onCopy={jest.fn()}
        onShare={jest.fn()}
      />,
    );

    expect(screen.getByText("ABCD-1234")).toBeTruthy();
    expect(screen.getByText(/un solo uso/i)).toBeTruthy();
    expect(screen.queryByText(/https?:\/\//)).toBeNull();
  });

  it("copies the complete code and announces success", async () => {
    const onCopy = jest.fn();
    await renderWithProviders(
      <InviteCode code="ABCD1234" expiresAt={expiresAt} daysRemaining={7} onCopy={onCopy} />,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Copiar código" }));

    expect(onCopy).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByText("Código copiado al portapapeles.")).toBeTruthy(),
    );
  });

  it("does not allow reusing a used code", async () => {
    await renderWithProviders(
      <InviteCode
        code="ABCD1234"
        expiresAt={expiresAt}
        daysRemaining={0}
        status="used"
        onCopy={jest.fn()}
      />,
    );

    expect(screen.getByText("Usada")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Copiar código" })).toBeNull();
  });
});