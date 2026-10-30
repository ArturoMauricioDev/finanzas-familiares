import { fireEvent, render } from "@testing-library/react-native";

import { Button, ErrorMessage } from "../components/ui";

describe("mobile UI components", () => {
  it("renders and presses a button", () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button title="Continuar" onPress={onPress} />);

    fireEvent.press(getByRole("button"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders API error messages", () => {
    const { getByText } = render(<ErrorMessage message="Token inválido" />);

    expect(getByText("Token inválido")).toBeTruthy();
  });
});
