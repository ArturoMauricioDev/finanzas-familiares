import { fireEvent, screen, waitFor } from "@testing-library/react";

import { FamilyActions } from "@/components/family/FamilyActions";

import { renderWithProviders } from "./helpers/renderWithProviders";

describe("FamilyActions", () => {
  it("offers delete only when the family has one member", async () => {
    const onDelete = jest.fn();
    await renderWithProviders(
      <FamilyActions memberCount={1} onDelete={onDelete} onLeave={jest.fn()} />,
    );

    expect(screen.getAllByText("Eliminar familia").length).toBeGreaterThan(0);
    expect(screen.queryByText("Abandonar familia")).not.toBeInTheDocument();

    const buttons = screen.getAllByRole("button", { name: "Eliminar familia" });
    fireEvent.click(buttons[0]);
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Eliminar familia" })).toHaveLength(2),
    );
    const confirmButtons = screen.getAllByRole("button", { name: "Eliminar familia" });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
  });

  it("offers leave and never delete when the family has more than one member", async () => {
    const onLeave = jest.fn();
    await renderWithProviders(
      <FamilyActions memberCount={2} onDelete={jest.fn()} onLeave={onLeave} />,
    );

    expect(screen.queryByText("Eliminar familia")).not.toBeInTheDocument();
    expect(screen.getAllByText("Abandonar familia").length).toBeGreaterThan(0);

    const buttons = screen.getAllByRole("button", { name: "Abandonar familia" });
    fireEvent.click(buttons[0]);
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Abandonar familia" })).toHaveLength(2),
    );
    const confirmButtons = screen.getAllByRole("button", { name: "Abandonar familia" });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(onLeave).toHaveBeenCalledTimes(1));
  });

  it("disables the action and maps an error while loading", async () => {
    await renderWithProviders(
      <FamilyActions
        memberCount={1}
        loadingAction="delete"
        error="No se pudo eliminar la familia."
        onDelete={jest.fn()}
      />,
    );

    expect(screen.getByText("No se pudo eliminar la familia.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar familia" })).toBeDisabled();
  });
});