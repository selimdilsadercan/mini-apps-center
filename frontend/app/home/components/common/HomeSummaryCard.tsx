"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle, X, Archive } from "@phosphor-icons/react";
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
  hideLabel?: string;
  footerAction?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-app-border bg-app-surface shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
          style={{ backgroundColor: color }}
        >
          <Icon size={20} weight="fill" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-black text-app-text tracking-tight">{title}</p>
          <p className="text-[9px] font-bold text-app-muted tracking-wide">{subtitle}</p>
        </div>
        {href && (
          <Link
            href={href}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-app-muted hover:text-app-text hover:bg-app-surface-muted active:scale-95 transition-all shrink-0"
            aria-label={`${title} uygulamasını aç`}
          >
            <ArrowRight size={16} weight="bold" />
          </Link>
        )}
      </div>

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

      {(onHide || footerAction) && (
        <div className="px-4 py-2 border-t border-app-border/60 bg-app-surface-muted/20 flex items-center justify-between gap-4">
          <div className="flex-1 text-left">
            {footerAction}
          </div>
          {onHide && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onHide();
              }}
              className="flex items-center gap-1.5 text-app-muted hover:text-app-text text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 shrink-0"
            >
              <Archive size={12} weight="bold" />
              <span>{hideLabel || "Bugünlük Gizle"}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
