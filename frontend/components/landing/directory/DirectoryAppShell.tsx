"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import Header from "../Header";
import Footer from "../Footer";
import { DirectoryOpenAppButton } from "./DirectoryOpenAppButton";

interface DirectoryAppShellProps {
  appId: string;
  children: React.ReactNode;
}

/** Statik uygulama tanıtım sayfaları için ortak kabuk (Header + Footer). */
export default function DirectoryAppShell({ appId, children }: DirectoryAppShellProps) {
  return (
    <div className="relative min-h-screen bg-[#0a0a0c] text-zinc-100 overflow-x-hidden antialiased">
      <Header />

      <main className="pt-28">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-white mb-10 transition-colors"
          >
            <ArrowLeft size={16} />
            Kataloğa dön
          </Link>
        </div>

        {children}

        <div className="max-w-5xl mx-auto px-6 pb-16 pt-8">
          <DirectoryOpenAppButton appId={appId} />
        </div>
      </main>

      <Footer hideCTA />
    </div>
  );
}
