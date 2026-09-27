"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-serif text-3xl text-ink">Something went wrong</h1>
      <p className="text-ink-muted">Try again, or come back in a moment.</p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
