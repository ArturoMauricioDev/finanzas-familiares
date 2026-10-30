"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Page({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main style={{ maxWidth: 760, margin: "48px auto", padding: "0 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>{title}</h1>
        {subtitle ? <p style={{ color: "#555", marginTop: 8 }}>{subtitle}</p> : null}
      </header>
      {children}
    </main>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        background: "#fff",
      }}
    >
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>{label}</span>
      <input
        {...props}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          fontSize: 15,
        }}
      />
      {hint ? (
        <span style={{ display: "block", color: "#64748b", fontSize: 13, marginTop: 4 }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function Button({
  children,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  const colors = {
    primary: { background: "#0f766e", color: "#fff", border: "#0f766e" },
    secondary: { background: "#fff", color: "#0f172a", border: "#cbd5e1" },
    danger: { background: "#b91c1c", color: "#fff", border: "#b91c1c" },
  }[variant];

  return (
    <button
      {...props}
      style={{
        ...colors,
        padding: "10px 16px",
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: "solid",
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}

export function ErrorMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      style={{
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#991b1b",
        borderRadius: 8,
        padding: "10px 12px",
      }}
    >
      {message}
    </p>
  );
}

export function SuccessMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      role="status"
      style={{
        background: "#ecfdf5",
        border: "1px solid #a7f3d0",
        color: "#065f46",
        borderRadius: 8,
        padding: "10px 12px",
      }}
    >
      {message}
    </p>
  );
}

export function Loading({ message = "Cargando..." }: { message?: string }) {
  return <p style={{ color: "#64748b" }}>{message}</p>;
}
