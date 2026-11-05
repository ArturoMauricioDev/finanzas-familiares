import { fireEvent, render, screen } from "@testing-library/react-native";

import { Button, Card, EmptyState, ErrorMessage, Field, Loading } from "../components/ui";

describe("mobile MD3 components", () => {
  it("renders and presses a button with loading and disabled states", async () => {
    const onPress = jest.fn();
    const { rerender } = await render(<Button title="Continuar" onPress={onPress} />);

    await fireEvent.press(screen.getByRole("button", { name: "Continuar" }));
    expect(onPress).toHaveBeenCalledTimes(1);

    await rerender(<Button title="Continuar" loading disabled />);
    const button = screen.getByRole("button", { name: "Continuar" });
    expect(button.props.accessibilityState).toMatchObject({ disabled: true, busy: true });
  });

  it("labels text fields and announces errors", async () => {
    await render(<Field label="Nombre" error="El nombre es obligatorio" />);

    expect(screen.getByLabelText("Nombre")).toBeTruthy();
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("El nombre es obligatorio")).toBeTruthy();
  });

  it("renders feedback regions and empty states", async () => {
    await render(
      <>
        <ErrorMessage message="No pudimos cargar el grupo." />
        <Loading message="Cargando miembros" />
        <EmptyState title="Sin integrantes" description="Invita a tu familia." />
        <Card>
          <Button title="Generar invitación" />
        </Card>
      </>,
    );

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("No pudimos cargar el grupo.")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Cargando miembros" })).toBeTruthy();
    expect(screen.getByText("Sin integrantes")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Generar invitación" })).toBeTruthy();
  });
});