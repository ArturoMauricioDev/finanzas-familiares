import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import {
  Dialog,
  EmptyState,
  ErrorMessage,
  InlineBanner,
  Loading,
  SuccessMessage,
} from "../components/ui";

describe("mobile feedback states", () => {
  it("announces errors and success through banners", () => {
    render(
      <>
        <ErrorMessage message="No pudimos cargar el grupo." />
        <SuccessMessage message="Invitación generada." />
        <InlineBanner message="Datos de demostración" tone="info" />
      </>,
    );

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("No pudimos cargar el grupo.")).toBeTruthy();
    expect(screen.getByText("Invitación generada.")).toBeTruthy();
    expect(screen.getByText("Datos de demostración")).toBeTruthy();
  });

  it("renders loading and empty states", () => {
    render(
      <>
        <Loading message="Cargando miembros" />
        <EmptyState title="Sin integrantes" description="Invita a tu familia." />
      </>,
    );

    expect(screen.getByRole("progressbar", { name: "Cargando miembros" })).toBeTruthy();
    expect(screen.getByText("Sin integrantes")).toBeTruthy();
  });

  it("confirms destructive actions through a modal dialog", () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn();

    render(
      <Dialog open title="Dar de baja" onClose={onClose} closeLabel="Cancelar">
        <Text>¿Dar de baja a este miembro?</Text>
        <Text accessibilityRole="button" onPress={onConfirm}>
          Dar de baja
        </Text>
      </Dialog>,
    );

    expect(screen.getByText("¿Dar de baja a este miembro?")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalled();
    fireEvent.press(screen.getByRole("button", { name: "Dar de baja" }));
    expect(onConfirm).toHaveBeenCalled();
  });
});