import type { ReactNode } from "react";

import { Wordmark } from "@/components/ui/Wordmark";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-container-low">
      <header className="mx-auto flex max-w-3xl items-center px-4 py-5 sm:px-6">
        <Wordmark size="md" />
      </header>
      <div className="mx-auto max-w-3xl">{children}</div>
    </div>
  );
}
