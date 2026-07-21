"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle, X, Archive, Prohibit, ArrowsClockwise } from "@phosphor-icons/react";
import type { ComponentType, ReactNode } from "react";

export function HomeTaskCheckButton({
  onClick,
  disabled,
  completed = false,
}: {
  onClick?: () => void;
  disabled?: boolean;
  completed?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-app-surface-muted hover:bg-app-border/30 ${
        completed ? "text-app-muted" : "text-app-muted hover:text-app-text"
      }`}
    >
      {completed ? (
        <CheckCircle size={18} weight="fill" />
      ) : (
        <CheckCircle size={18} weight="regular" />
      )}
    </button>
  );
}

export function WidgetActionButton({
  onClick,
  icon: Icon,
  children,
  loading,
  selected = false,
  iconSize = 10,
}: {
  onClick: () => void;
  icon: ComponentType<{ size?: number; weight?: "bold" | "fill" }>;
  children: ReactNode;
  loading?: boolean;
  selected?: boolean;
  iconSize?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wide flex items-center gap-1 cursor-pointer hover:bg-app-surface-muted hover:border-app-muted active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-app-text border-app-border ${
        selected ? "opacity-60" : ""
      }`}
    >
      <Icon size={iconSize} weight="bold" />
      {children}
    </button>
  );
}

export function HomeWidgetsDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 border-t border-dashed border-app-border" />
      <span className="text-[10px] font-black text-app-muted uppercase tracking-[0.2em]">
        {label || "—"}
      </span>
      <div className="flex-1 border-t border-dashed border-app-border" />
    </div>
  );
}

export function HomeGroupHeader({ title }: { title: string }) {
  return (
    <div className="pt-3 pb-1 px-1">
      <h3 className="text-xs font-black uppercase tracking-wider text-app-text">
        {title}
      </h3>
    </div>
  );
}

export function HomeSummaryCard({
  href,
  icon: Icon,
  color,
  title,
  subtitle,
  loading,
  emptyText,
  hasContent,
  emptyFooter,
  onHide,
  onHideToday,
  onHidePermanent,
  isTodayHidden,
  isPermanentlyHidden,
  onRestore,
  hideLabel,
  footerAction,
  children,
}: {
  href?: string;
  icon: ComponentType<{ size?: number; weight?: "bold" | "fill" }>;
  color: string;
  title: string;
  subtitle: string;
  loading: boolean;
  emptyText: string;
  hasContent: boolean;
  emptyFooter?: ReactNode;
  onHide?: () => void;
  onHideToday?: () => void;
  onHidePermanent?: () => void;
  isTodayHidden?: boolean;
  isPermanentlyHidden?: boolean;
  onRestore?: () => void;
  hideLabel?: string;
  footerAction?: ReactNode;
  children?: ReactNode;
}) {
  const headerContent = (
    <>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover/header:scale-105"
        style={{ backgroundColor: color }}
      >
        <Icon size={20} weight="fill" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-black text-app-text tracking-tight">{title}</p>
        <p className="text-[9px] font-bold text-app-muted tracking-wide">{subtitle}</p>
      </div>
      {href && (
        <ArrowRight size={14} className="text-app-muted group-hover/header:text-app-text transition-colors shrink-0" />
      )}
    </>
  );

  return (
    <div className="rounded-2xl border border-app-border bg-app-surface shadow-sm flex flex-col">
      {href ? (
        <Link
          href={href}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-app-surface-muted/30 transition-all select-none group/header border-b border-transparent rounded-t-2xl"
          aria-label={`${title} uygulamasını aç`}
        >
          {headerContent}
        </Link>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-t-2xl">
          {headerContent}
        </div>
      )}

      {loading ? (
        <div className="px-4 py-4 border-t border-app-border space-y-2">
          <div className="h-9 bg-app-surface-muted rounded-xl animate-pulse" />
          <div className="h-9 bg-app-surface-muted rounded-xl animate-pulse" />
        </div>
      ) : hasContent ? (
        children
      ) : (
        <div className="border-t border-app-border">
          {!emptyFooter && (
            <div className="px-4 py-4 text-center">
              <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">{emptyText}</p>
            </div>
          )}
          {emptyFooter}
        </div>
      )}

      {(onHideToday || onHidePermanent || onHide || onRestore || footerAction) && (
        <div className="px-4 py-2 border-t border-app-border/60 bg-app-surface-muted/20 flex items-center justify-between gap-4 rounded-b-2xl">
          <div className="flex-1 text-left">
            {footerAction}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* 1. Bugünlük Gizle / Kaldır Button */}
            {(onHideToday || onHide) && (
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isTodayHidden) {
                      if (onRestore) onRestore();
                      else if (onHide) onHide();
                    } else {
                      if (onHideToday) onHideToday();
                      else if (onHide) onHide();
                    }
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                    isTodayHidden
                      ? "text-app-text bg-app-surface-muted hover:bg-app-surface-muted/80"
                      : "text-app-muted hover:text-app-text hover:bg-app-surface-muted"
                  }`}
                  aria-label={isTodayHidden ? "Gizlemeyi Kaldır" : "Bugünlük Gizle"}
                >
                  <Archive size={18} weight={isTodayHidden ? "fill" : "bold"} />
                </button>
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none transition-all duration-150">
                  <div className="bg-black text-white text-[11px] font-medium py-1.5 px-3 rounded-lg shadow-lg whitespace-nowrap leading-none">
                    {isTodayHidden ? "Gizlemeyi Kaldır" : "Bugünlük Gizle"}
                  </div>
                  <div className="w-2 h-2 bg-black rotate-45 -mt-1 shadow-md"></div>
                </div>
              </div>
            )}

            {/* 2. Kalıcı Gizle / Kaldır Button */}
            {onHidePermanent && (
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPermanentlyHidden) {
                      if (onRestore) onRestore();
                    } else {
                      onHidePermanent();
                    }
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                    isPermanentlyHidden
                      ? "text-app-text bg-app-surface-muted hover:bg-app-surface-muted/80"
                      : "text-app-muted hover:text-app-text hover:bg-app-surface-muted"
                  }`}
                  aria-label={isPermanentlyHidden ? "Gizlemeyi Kaldır" : "Kalıcı Gizle"}
                >
                  <Prohibit size={18} weight={isPermanentlyHidden ? "fill" : "bold"} />
                </button>
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none transition-all duration-150">
                  <div className="bg-black text-white text-[11px] font-medium py-1.5 px-3 rounded-lg shadow-lg whitespace-nowrap leading-none">
                    {isPermanentlyHidden ? "Gizlemeyi Kaldır" : "Kalıcı Gizle"}
                  </div>
                  <div className="w-2 h-2 bg-black rotate-45 -mt-1 shadow-md"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
