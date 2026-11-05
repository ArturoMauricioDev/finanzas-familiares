"use client";

import { Search } from "lucide-react";

import { TextField, type TextFieldProps } from "./TextField";

export function SearchField({ label, placeholder, ...props }: TextFieldProps) {
  return (
    <TextField
      type="search"
      label={label}
      placeholder={placeholder}
      leading={<Search size={20} aria-hidden="true" />}
      {...props}
    />
  );
}