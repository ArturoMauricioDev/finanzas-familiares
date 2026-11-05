import { cn } from "@/lib/cn";

export function Wordmark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "text-title-medium",
    md: "text-title-large",
    lg: "text-headline-medium",
  };
  const markSizes = {
    sm: "h-7 w-7 text-label-large",
    md: "h-9 w-9 text-title-medium",
    lg: "h-12 w-12 text-headline-small",
  };

  return (
    <span className={cn("inline-flex items-center gap-2 text-on-surface", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex items-center justify-center rounded-sm bg-primary font-bold text-on-primary",
          markSizes[size],
        )}
      >
        K
      </span>
      <span className={cn("font-bold tracking-tight", sizes[size])}>Kitho</span>
    </span>
  );
}
