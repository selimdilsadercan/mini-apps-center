function SkeletonLine({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-app-surface-muted rounded ${className ?? ""}`} />;
}

export function GameListItemSkeleton() {
  return (
    <div className="px-3 py-2.5 bg-app-surface rounded-2xl border border-app-border">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-1.5">
          <SkeletonLine className="h-3.5 w-36" />
          <SkeletonLine className="h-2 w-28" />
        </div>
        <div className="flex gap-1 shrink-0">
          <SkeletonLine className="w-7 h-7 rounded-lg" />
          <SkeletonLine className="w-7 h-7 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function DiscoverPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <SkeletonLine className="h-11 w-full rounded-2xl" />
      <div className="space-y-2">
        <SkeletonLine className="h-2 w-24 ml-1" />
        <SkeletonLine className="h-10 w-full rounded-2xl" />
      </div>
      <SkeletonLine className="h-2 w-32 ml-1" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <GameListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ForYouPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonLine className="h-2 w-32 ml-1" />
        <div className="space-y-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <GameListItemSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
