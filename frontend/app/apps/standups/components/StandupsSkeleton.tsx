export function StandupsPageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <section>
        <div className="h-3 w-24 bg-app-surface-muted rounded mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shrink-0 w-[72px] space-y-2">
              <div className="w-[72px] h-[72px] rounded-2xl bg-app-surface-muted" />
              <div className="h-2 w-full bg-app-surface-muted rounded" />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="h-3 w-32 bg-app-surface-muted rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-app-surface-muted border border-app-border" />
        ))}
      </section>
    </div>
  );
}
