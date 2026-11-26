"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export interface MenuItem {
  id: string;
  label: string;
  onSelect: () => void;
}

export function Menu({
  label,
  items,
  trigger,
  triggerClassName,
}: {
  label: string;
  items: MenuItem[];
  trigger?: ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerId = useId();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative inline-block">
      <button
        type="button"
        aria-label={trigger ? label : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={containerId}
        onClick={() => setOpen((current) => !current)}
        className={
          trigger
            ? `inline-flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${triggerClassName ?? ""}`
            : "inline-flex min-h-12 items-center rounded-full border border-outline px-4 text-label-large text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        }
      >
        {trigger ?? label}
      </button>
      {open ? (
        <div
          id={containerId}
          role="menu"
          className="absolute right-0 z-50 mt-2 min-w-48 rounded-sm border border-outline-variant bg-surface p-1 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => {
                item.onSelect();
                setOpen(false);
              }}
              className="flex min-h-11 w-full items-center rounded-sm px-3 text-left text-body-medium text-on-surface hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}