"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Minus, Plus, Check } from "@phosphor-icons/react";
import { toast } from "react-hot-toast";
import TUSKitapShell from "../components/TUSKitapShell";
import { getBookById, formatBookName } from "../data/books_data";
import {
  decrementSection,
  getBookCompletionStats,
  getSectionProgress,
  incrementSection,
  loadProgress,
  saveProgress,
  type AllProgress,
} from "../lib/progress";

const USER_ID = "local_user";

function TUSBookDetailContent() {
  const searchParams = useSearchParams();
  const bookId = searchParams.get("id") ?? "";
  const book = getBookById(bookId);

  const [progress, setProgress] = useState<AllProgress>({});

  useEffect(() => {
    setProgress(loadProgress(USER_ID));
  }, []);

  const sortedSections = useMemo(
    () => [...(book?.sections ?? [])].sort((a, b) => a.order - b.order),
    [book]
  );

  const stats = book
    ? getBookCompletionStats(progress, book.id, sortedSections.length)
    : { completedSections: 0, totalCompletions: 0, percent: 0 };

  const updateProgress = (updated: AllProgress) => {
    setProgress(updated);
    saveProgress(USER_ID, updated);
  };

  const handleIncrement = (sectionId: string) => {
    if (!book) return;
    updateProgress(incrementSection(progress, book.id, sectionId));
    toast.success("Tekrar eklendi", { duration: 1500 });
  };

  const handleDecrement = (sectionId: string) => {
    if (!book) return;
    updateProgress(decrementSection(progress, book.id, sectionId));
  };

  if (!bookId || !book) {
    return (
      <TUSKitapShell showTabs={false} title="Kitap bulunamadı">
        <div className="text-center py-12 text-gray-400 text-sm">Bu kitap mevcut değil.</div>
      </TUSKitapShell>
    );
  }

  return (
    <TUSKitapShell showTabs={false} title={formatBookName(book.name)}>
      <div className="space-y-3">
        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-14 shrink-0">
            <Image
              src={book.imageUrl}
              alt={formatBookName(book.name)}
              width={40}
              height={56}
              className="object-contain w-full h-full"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {formatBookName(book.name)}
            </p>
            {sortedSections.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden max-w-[140px]">
                  <div
                    className="h-full rounded-full bg-gray-400 dark:bg-zinc-500"
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">
                  {stats.completedSections}/{sortedSections.length} · {stats.totalCompletions}x
                </span>
              </div>
            )}
          </div>
        </div>

        {sortedSections.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">Bölüm listesi henüz yok.</p>
        ) : (
          <ul className="bg-white dark:bg-zinc-900 rounded-xl divide-y divide-gray-100 dark:divide-zinc-800">
            {sortedSections.map((section) => {
              const sp = getSectionProgress(progress, book.id, section.id);
              const done = sp.completions > 0;

              return (
                <li key={section.id} className="flex items-center gap-2.5 px-3 py-2">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                      done
                        ? "bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                        : "bg-gray-100 dark:bg-zinc-800 text-gray-400"
                    }`}
                  >
                    {done ? (
                      <Check size={12} weight="bold" />
                    ) : (
                      <span className="text-[8px] font-bold">{section.order}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {section.name}
                    </p>
                    {sp.completions > 0 && (
                      <p className="text-[9px] text-gray-400">{sp.completions}x</p>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => handleDecrement(section.id)}
                      disabled={sp.completions === 0}
                      className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-500 flex items-center justify-center disabled:opacity-30 cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <Minus size={12} weight="bold" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-gray-700 dark:text-zinc-300">
                      {sp.completions}
                    </span>
                    <button
                      onClick={() => handleIncrement(section.id)}
                      className="w-7 h-7 rounded-lg bg-gray-500 dark:bg-zinc-600 text-white flex items-center justify-center cursor-pointer hover:bg-gray-600 dark:hover:bg-zinc-500 active:scale-95 transition-colors"
                    >
                      <Plus size={12} weight="bold" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </TUSKitapShell>
  );
}

export default function TUSBookDetailPage() {
  return (
    <Suspense
      fallback={
        <TUSKitapShell showTabs={false} title="Yükleniyor...">
          <div className="text-center py-12 text-gray-400 text-sm">Yükleniyor...</div>
        </TUSKitapShell>
      }
    >
      <TUSBookDetailContent />
    </Suspense>
  );
}
