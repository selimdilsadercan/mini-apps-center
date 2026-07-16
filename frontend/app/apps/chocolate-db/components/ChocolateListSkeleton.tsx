function SkeletonLine({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-app-surface-muted rounded ${className ?? ""}`} />;
}

export function ChocolateListItemSkeleton() {
  return (
    <div className="p-2.5 bg-app-surface rounded-2xl border border-app-border">
      <SkeletonLine className="aspect-square w-full rounded-xl mb-2" />
      <SkeletonLine className="h-3 w-full" />
      <SkeletonLine className="h-2 w-2/3 mt-1.5" />
      <div className="flex gap-1 mt-2">
        <SkeletonLine className="flex-1 h-7 rounded-lg" />
        <SkeletonLine className="flex-1 h-7 rounded-lg" />
        <SkeletonLine className="flex-1 h-7 rounded-lg" />
      </div>
    </div>
  );
}

export function DiscoverPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <SkeletonLine className="h-11 w-full rounded-2xl" />
      <SkeletonLine className="h-10 w-full rounded-2xl" />
      <SkeletonLine className="h-2 w-28 ml-1" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <ChocolateListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function SavedPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <SkeletonLine className="h-10 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <ChocolateListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
