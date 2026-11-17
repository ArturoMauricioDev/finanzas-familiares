"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  loading = false,
}: {
  onSuccess: (credential: string) => void;
  onError: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const busy = disabled || loading;

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    if (busy) node.setAttribute("inert", "");
    else node.removeAttribute("inert");
  }, [busy]);

  return (
    <div className="relative w-full max-w-[320px]" aria-busy={loading || undefined}>
      <div
        ref={wrapperRef}
        className={cn(busy && "pointer-events-none opacity-50")}
        data-disabled={busy || undefined}
      >
        <GoogleLogin
          onSuccess={(response) => onSuccess(response.credential ?? "")}
          onError={onError}
          useOneTap={false}
          shape="pill"
          size="large"
          text="continue_with"
          theme="outline"
        />
      </div>
      {loading ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-surface/60">
          <Spinner />
        </div>
      ) : null}
    </div>
  );
}
