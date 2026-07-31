export const NE_YAPSAK_ACCENT = "#FF5252";

export const PLAN_OPEN_LOCATION = "📍 Yer birlikte seçilecek";
export const PLAN_OPEN_TIME = "🕐 Zaman birlikte seçilecek";

export const tabClass = (active: boolean) =>
  `inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all active:scale-[0.98] outline-none whitespace-nowrap ${
    active ? "bg-app-tab-active text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
  }`;

export const fieldClass =
  "w-full bg-app-surface-muted border border-app-border rounded-xl px-4 py-3 text-xs font-bold text-app-text placeholder:text-app-muted focus:outline-none focus:border-[#FF5252]/40 transition-colors";

export const sectionLabelClass =
  "font-black text-[10px] text-app-muted uppercase tracking-[0.14em] block";

export const planCardClass =
  "rounded-2xl border border-app-border bg-app-surface p-4 space-y-3.5";

export const planCardInnerClass = "border-t border-app-border/60 pt-3.5 space-y-3";

export const innerLabelClass =
  "text-[9px] font-black text-app-muted uppercase tracking-[0.12em] block";

export const segmentedWrapClass =
  "flex p-1 gap-1 rounded-xl bg-app-surface-muted border border-app-border";

export const segmentedItemClass = (active: boolean) =>
  `flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer ${
    active
      ? "bg-app-tab-active text-app-text shadow-sm"
      : "text-app-muted hover:text-app-text"
  }`;

export const embeddedRowClass = (selected: boolean) =>
  `w-full rounded-lg text-left text-xs font-bold transition-all cursor-pointer active:scale-[0.99] px-3 py-2.5 ${
    selected
      ? "bg-[#FF5252]/10 text-app-text ring-1 ring-[#FF5252]/25"
      : "bg-app-surface-muted/60 text-app-text hover:bg-app-surface-muted"
  }`;

export const modeChipClass = (active: boolean) =>
  `px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer ${
    active
      ? "bg-app-tab-active border-app-border text-app-text shadow-sm"
      : "bg-app-surface-muted border-app-border text-app-muted hover:text-app-text"
  }`;

export const friendChipClass = (selected: boolean) =>
  `flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all text-xs font-bold cursor-pointer ${
    selected
      ? "border-[#FF5252]/40 text-app-text"
      : "bg-app-surface-muted border-app-border text-app-text hover:bg-app-surface-muted/80"
  }`;

export const primaryBtnClass =
  "w-full py-3.5 text-white rounded-xl font-black text-[11px] uppercase tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none";

export const pickerItemClass = (selected: boolean) =>
  `flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all text-xs font-bold cursor-pointer active:scale-[0.98] ${
    selected
      ? "border-[#FF5252]/40 text-app-text"
      : "bg-app-surface-muted border-app-border text-app-text hover:bg-app-surface-muted/80"
  }`;

export const pickerRowClass = (selected: boolean) =>
  `w-full rounded-xl border text-left text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${
    selected
      ? "border-[#FF5252]/40 text-app-text"
      : "bg-app-surface-muted border-app-border text-app-text hover:bg-app-surface-muted/80"
  }`;

export const pickerBadgeClass = (selected: boolean) =>
  `text-[10px] px-2 py-0.5 rounded-lg font-semibold shrink-0 ${
    selected ? "bg-[#FF5252]/15 text-app-text" : "bg-app-surface border border-app-border text-app-muted"
  }`;

export const accentHighlightClass =
  "mb-4 w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer text-xs font-bold shrink-0 active:scale-[0.98] border-[#FF5252]/30 bg-[#FF5252]/8 text-app-text hover:bg-[#FF5252]/12";

export const secondaryBtnClass =
  "flex-1 py-3.5 bg-app-surface-muted hover:bg-app-border/50 text-app-muted rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer text-center border border-app-border";

export const drawerHandleClass = "mx-auto w-10 h-1 flex-shrink-0 rounded-full bg-app-border mb-4";

export const iconBtnClass =
  "p-1.5 hover:bg-app-surface-muted rounded-lg transition-colors active:scale-95 text-app-muted";
