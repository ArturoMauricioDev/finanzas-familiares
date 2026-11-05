import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "elevated" | "filled" | "outlined";

const variants: Record<Variant, string> = {
  elevated: "bg-surface-container-low shadow-sm",
  filled: "bg-surface-container-high",
  outlined: "border border-outline-variant bg-surface",
};

export function Card({
  children,
  className,
  variant = "outlined",
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode; variant?: Variant }) {
  return (
    <section
      {...props}
      className={cn("rounded-lg p-6", variants[variant], className)}
    >
      {children}
    </section>
  );
}
