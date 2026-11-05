import type { ComponentProps } from "react";

import { Field } from "./Field";

export function SearchField(props: ComponentProps<typeof Field>) {
  return <Field returnKeyType="search" autoCapitalize="none" {...props} />;
}