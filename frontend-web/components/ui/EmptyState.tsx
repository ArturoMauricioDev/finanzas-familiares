import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-6 py-10 text-center">
      {icon ? <div className="mb-3 text-primary">{icon}</div> : null}
      <h3 className="text-title-medium text-on-surface">{title}</h3>
      <p className="mt-2 max-w-md text-body-medium text-on-surface-variant">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
