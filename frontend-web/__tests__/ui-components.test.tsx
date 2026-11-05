import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import {
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  Loading,
  RadioGroup,
  Select,
  TextField,
} from "../components/ui";

describe("web MD3 components", () => {
  it("renders the button variants and exposes disabled/loading states", () => {
    const onClick = jest.fn();
    const { rerender } = render(
      <Button variant="tonal" onClick={onClick}>
        Guardar
      </Button>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button loading disabled>
        Guardar
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Guardar" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("announces field errors and hints", () => {
    render(<TextField label="Nombre" hint="Visible para tu familia" />);
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    expect(screen.getByText("Visible para tu familia")).toBeInTheDocument();
  });

  it("renders select and radio groups accessibly", () => {
    const onChange = jest.fn();
    render(
      <>
        <Select
          label="Moneda"
          value="MXN"
          onChange={() => undefined}
          options={[
            { value: "MXN", label: "Peso mexicano" },
            { value: "EUR", label: "Euro" },
          ]}
        />
        <RadioGroup
          name="theme"
          legend="Tema"
          value="system"
          onChange={onChange}
          options={[
            { value: "system", label: "Sistema" },
            { value: "dark", label: "Oscuro" },
          ]}
        />
      </>,
    );

    expect(screen.getByLabelText("Moneda")).toHaveValue("MXN");
    expect(screen.getByRole("radio", { name: /Oscuro/ })).not.toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: /Oscuro/ }));
    expect(onChange).toHaveBeenCalledWith("dark");
  });

  it("renders feedback states with live regions", () => {
    render(
      <>
        <ErrorMessage message="Ocurrió un error" />
        <Loading message="Cargando miembros" />
        <EmptyState title="Sin integrantes" description="Invita a tu familia." />
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Ocurrió un error");
    expect(screen.getByRole("status")).toHaveTextContent("Cargando miembros");
    expect(screen.getByText("Sin integrantes")).toBeInTheDocument();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(
      <Card>
        <TextField label="Correo" type="email" />
        <Button>Continuar</Button>
      </Card>,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});