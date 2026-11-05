import { fireEvent, render, screen } from "@testing-library/react";

import {
  ConfirmDialog,
  EmptyState,
  ErrorMessage,
  Loading,
  SuccessMessage,
} from "../components/ui";

describe("web feedback states", () => {
  it("uses alert for errors and status for success", () => {
    render(
      <>
        <ErrorMessage message="No pudimos cargar el grupo." />
        <SuccessMessage message="Invitación generada." />
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar el grupo.");
    expect(screen.getByRole("status")).toHaveTextContent("Invitación generada.");
  });

  it("renders loading with a polite live region", () => {
    render(<Loading message="Cargando miembros" />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Cargando miembros");
  });

  it("renders an empty state with a suggested action", () => {
    render(
      <EmptyState
        title="Sin integrantes"
        description="Invita a tu familia para empezar."
        action={<button type="button">Generar invitación</button>}
      />,
    );

    expect(screen.getByText("Sin integrantes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generar invitación" })).toBeInTheDocument();
  });

  it("confirms destructive actions through the dialog", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConfirmDialog
        open
        title="Dar de baja"
        description="¿Dar de baja a este miembro?"
        confirmLabel="Dar de baja"
        cancelLabel="Cancelar"
        destructive
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByRole("button", { name: "Cancelar" })[0]);
    expect(onCancel).toHaveBeenCalled();
  });
});