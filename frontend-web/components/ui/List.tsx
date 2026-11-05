import type { HTMLAttributes, LiHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export function List({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLUListElement> & { children: ReactNode }) {
  return (
    <ul {...props} className={cn("divide-y divide-outline-variant", className)}>
      {children}
    </ul>
  );
}

export function ListItem({
  children,
  className,
  ...props
}: LiHTMLAttributes<HTMLLIElement> & { children: ReactNode }) {
  return (
    <li {...props} className={cn("flex min-h-12 items-center gap-3 py-3", className)}>
      {children}
    </li>
  );
}

export function Divider({
  className,
  ...props
}: HTMLAttributes<HTMLHRElement>) {
  return <hr {...props} className={cn("border-0 border-t border-outline-variant", className)} />;
}