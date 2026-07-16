export function pillTabClass(active: boolean) {
  return `inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all active:scale-[0.98] outline-none whitespace-nowrap ${
    active
      ? "bg-app-tab-active text-app-text shadow-sm"
      : "text-app-muted hover:text-app-text hover:bg-app-surface-muted/50"
  }`;
}

export function PillTabBar({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track w-full ${className}`}>
      {children}
    </div>
  );
}

export function PillTabBarScroll({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track overflow-x-auto max-w-full ${className}`}>
      {children}
    </div>
  );
}
