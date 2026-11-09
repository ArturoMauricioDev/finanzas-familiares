import { fireEvent, screen, waitFor } from "@testing-library/react";

import { InviteCode } from "@/components/family/InviteCode";

import { renderWithProviders } from "./helpers/renderWithProviders";

const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

describe("InviteCode", () => {
  it("shows only a normalized code with its single-use expiry", async () => {
    await renderWithProviders(
      <InviteCode
        code="ABCD1234"
        expiresAt={expiresAt}
        daysRemaining={7}
        onCopy={jest.fn()}
        onShare={jest.fn()}
      />,
    );

    expect(screen.getByText("ABCD-1234")).toBeInTheDocument();
    expect(screen.getByText(/un solo uso/i)).toBeInTheDocument();
    expect(screen.queryByText(/https?:\/\//)).not.toBeInTheDocument();
  });

  it("copies the complete code and announces success", async () => {
    const onCopy = jest.fn();
    await renderWithProviders(
      <InviteCode code="ABCD1234" expiresAt={expiresAt} daysRemaining={7} onCopy={onCopy} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copiar código" }));

    expect(onCopy).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Código copiado"),
    );
  });

  it("hides copy and share actions when the code is already used", async () => {
    await renderWithProviders(
      <InviteCode
        code="ABCD1234"
        expiresAt={expiresAt}
        daysRemaining={0}
        status="used"
        onCopy={jest.fn()}
        onShare={jest.fn()}
      />,
    );

    expect(screen.getByText("Usada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copiar código" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Compartir código" })).not.toBeInTheDocument();
  });
});