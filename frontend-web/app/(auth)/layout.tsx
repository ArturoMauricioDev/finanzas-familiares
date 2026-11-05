import type { ReactNode } from "react";

import { Wordmark } from "@/components/ui/Wordmark";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-container-low px-4 py-10">
      <div className="mb-6">
        <Wordmark size="lg" />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
