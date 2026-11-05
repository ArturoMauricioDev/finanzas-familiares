import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  label = "Ruta de navegación",
}: {
  items: BreadcrumbItem[];
  label?: string;
}) {
  return (
    <nav aria-label={label}>
      <ol className="flex flex-wrap items-center gap-2 text-body-small text-on-surface-variant">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !current ? (
                <Link href={item.href} className="rounded-sm text-primary hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={current ? "page" : undefined}>{item.label}</span>
              )}
              {current ? null : (
                <span aria-hidden="true" className="text-on-surface-variant/60">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}