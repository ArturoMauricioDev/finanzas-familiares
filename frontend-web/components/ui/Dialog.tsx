"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import { Button } from "./Button";

export function Dialog({
  open,
  title,
  children,
  onClose,
  closeLabel = "Cerrar",
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  closeLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="w-[min(92vw,32rem)] rounded-lg border border-outline-variant bg-surface p-0 text-on-surface shadow-lg backdrop:bg-scrim/40"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="p-6">
        <header className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-title-large text-on-surface">
            {title}
          </h2>
          <Button variant="text" size="sm" onClick={onClose}>
            {closeLabel}
          </Button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} title={title} onClose={onCancel} closeLabel={cancelLabel}>
      <p className="mb-6 text-body-medium text-on-surface-variant">{description}</p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="text" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
