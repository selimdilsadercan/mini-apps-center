"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import TUSKitapShell from "../components/TUSKitapShell";
import { TUS_BOOKS, formatBookName } from "../data/books_data";
import { getBookCompletionStats, loadProgress, type AllProgress } from "../lib/progress";
import { CaretRight, ArrowsClockwise } from "@phosphor-icons/react";

const USER_ID = "local_user";

export default function TUSKitapProgressPage() {
  const [progress, setProgress] = useState<AllProgress>({});

  useEffect(() => {
    setProgress(loadProgress(USER_ID));
  }, []);

  const booksWithSections = TUS_BOOKS.filter((b) => b.sections.length > 0);

  const totalCompletions = TUS_BOOKS.reduce((sum, book) => {
    const stats = getBookCompletionStats(progress, book.id, book.sections.length);
    return sum + stats.totalCompletions;
  }, 0);

  const totalCompletedSections = TUS_BOOKS.reduce((sum, book) => {
    const stats = getBookCompletionStats(progress, book.id, book.sections.length);
    return sum + stats.completedSections;
  }, 0);

  const totalSections = TUS_BOOKS.reduce((sum, b) => sum + b.sections.length, 0);

  return (
    <TUSKitapShell activeTab="progress">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-gray-900 dark:text-white">{TUS_BOOKS.length}</p>
            <p className="text-[9px] text-gray-400 uppercase font-bold">Kitap</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-gray-900 dark:text-white">
              {totalSections > 0 ? `${totalCompletedSections}/${totalSections}` : "—"}
            </p>
            <p className="text-[9px] text-gray-400 uppercase font-bold">Bölüm</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-gray-900 dark:text-white">{totalCompletions}</p>
            <p className="text-[9px] text-gray-400 uppercase font-bold">Tekrar</p>
          </div>
        </div>

        {booksWithSections.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center">
            <ArrowsClockwise size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">Henüz bölüm tanımlanmadı</p>
            <p className="text-xs text-gray-400 mt-1">
              Kitap bölümleri eklendiğinde ilerleme burada görünecek.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-zinc-800">
            {booksWithSections.map((book) => {
              const stats = getBookCompletionStats(progress, book.id, book.sections.length);
              return (
                <Link
                  key={book.id}
                  href={`/apps/tus-kitap/${book.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="w-8 h-11 shrink-0">
                    <Image
                      src={book.imageUrl}
                      alt={formatBookName(book.name)}
                      width={32}
                      height={44}
                      className="object-contain w-full h-full"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {formatBookName(book.name)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden max-w-[100px]">
                        <div
                          className="h-full rounded-full bg-gray-400 dark:bg-zinc-500"
                          style={{ width: `${stats.percent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {stats.completedSections}/{book.sections.length} · {stats.totalCompletions}x
                      </span>
                    </div>
                  </div>
                  <CaretRight size={14} className="text-gray-300 dark:text-zinc-600 shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </TUSKitapShell>
  );
}
