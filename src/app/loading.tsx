import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200/90 shadow-xs flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-neutral-300 border-t-[#0284c7] animate-spin" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-xs font-semibold tracking-widest uppercase text-neutral-400">
            ViteDrop&reg;
          </span>
          <span className="text-xs text-neutral-500 font-medium">
            Loading secure session...
          </span>
        </div>
      </div>
    </div>
  );
}
