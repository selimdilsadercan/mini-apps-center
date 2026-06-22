"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, Bell } from "lucide-react";

const tabs = [
  { href: "/apps/itu-yemekhane", label: "Menü", icon: ChefHat, exact: true },
  { href: "/apps/itu-yemekhane/notifications", label: "Bildirimler", icon: Bell, exact: false },
];

export default function ITUYemekhaneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0F172A] font-sans flex flex-col">
      <div className="flex-1 pb-24">{children}</div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-6 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
        <div className="max-w-lg mx-auto flex justify-around">
          {tabs.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${
                  active
                    ? "text-[#EAB308]"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
