"use client";

import React from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    console.error("ViteDrop Global Fatal Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fafafa] text-[#0a0a0a] antialiased flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-neutral-200/90 rounded-2xl p-8 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto mb-5">
            <AlertOctagon className="w-7 h-7" />
          </div>

          <span className="inline-block px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200/60 rounded-full mb-3">
            Fatal Error
          </span>

          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight mb-2">
            Critical System Exception
          </h1>

          <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
            The application encountered a critical startup error. Your ledger balances and active orders remain secured.
          </p>

          <button
            type="button"
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full bg-[#0a0a0a] text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reload ViteDrop
          </button>

          <div className="mt-6 text-xs font-mono text-neutral-400">
            ViteDrop Platform Recovery
          </div>
        </div>
      </body>
    </html>
  );
}
