"use client";

import React from "react";

/* ───── base pulse bar ───── */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

/* ───── card skeleton ───── */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

/* ───── table skeleton ───── */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="grid gap-4 p-4 border-b border-gray-100" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-3/4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-4 p-4 border-b border-gray-50" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-3 ${c === 0 ? "w-full" : "w-2/3"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ───── stat card skeleton ───── */
export function StatSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-2 w-2/3" />
    </div>
  );
}

/* ───── list skeleton ───── */
export function ListSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
