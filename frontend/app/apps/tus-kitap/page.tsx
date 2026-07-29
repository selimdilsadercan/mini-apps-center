"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import TUSKitapShell from "./components/TUSKitapShell";
import { TUS_BOOKS, formatBookName, getBookDetailHref } from "./data/books_data";
import { getBookCompletionStats, loadProgress, type AllProgress } from "./lib/progress";
import { ArrowRight, CaretRight } from "@phosphor-icons/react";

const USER_ID = "local_user";

export default function TUSKitapPage() {
  const [progress, setProgress] = useState<AllProgress>({});

  useEffect(() => {
    setProgress(loadProgress(USER_ID));
  }, []);

  const temelBooks = useMemo(() => TUS_BOOKS.filter((b) => b.category === "temel"), []);
  const klinikBooks = useMemo(() => TUS_BOOKS.filter((b) => b.category === "klinik"), []);

  const renderBookRow = (book: (typeof TUS_BOOKS)[0]) => {
    const stats = getBookCompletionStats(progress, book.id, book.sections.length);

    return (
      <Link
        key={book.id}
        href={getBookDetailHref(book.id)}
        className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="w-10 h-14 shrink-0 flex items-center justify-center overflow-hidden rounded-lg bg-gray-50 dark:bg-zinc-800/60">
          <Image
            src={book.imageUrl}
            alt={formatBookName(book.name)}
            width={40}
            height={56}
            className="object-contain max-h-full w-auto rounded-md"
            unoptimized
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {formatBookName(book.name)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden max-w-[120px]">
              <div
                className="h-full rounded-full bg-gray-400 dark:bg-zinc-500 transition-all"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 shrink-0">
              {stats.completedSections}/{book.sections.length}
              {stats.totalCompletions > 0 && ` · ${stats.totalCompletions}x`}
            </span>
          </div>
        </div>

        <CaretRight size={14} className="text-gray-300 dark:text-zinc-600 shrink-0" />
      </Link>
    );
  };

  const renderSection = (title: string, books: typeof TUS_BOOKS) => (
    <section>
      <h2 className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1 mb-1.5">
        {title}
      </h2>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden divide-y divide-gray-100/80 dark:divide-zinc-800/80">
        {books.map(renderBookRow)}
      </div>
    </section>
  );

  return (
    <TUSKitapShell activeTab="books">
      <div className="space-y-5">
        {renderSection("Temel Bilimler", temelBooks)}
        {renderSection("Klinik Bilimler", klinikBooks)}

        <Link
          href="/apps/tus-kitap/progress"
          className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-zinc-900 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <div>
            <p className="text-xs font-bold text-gray-900 dark:text-white">İlerleme Özeti</p>
            <p className="text-[10px] text-gray-400">Tüm kitaplar</p>
          </div>
          <ArrowRight size={16} className="text-gray-400" />
        </Link>
      </div>
    </TUSKitapShell>
  );
}
