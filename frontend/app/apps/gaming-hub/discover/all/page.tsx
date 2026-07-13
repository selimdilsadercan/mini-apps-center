"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GamingHubShell from "../../components/GamingHubShell";
import DiscoverAllToolbar from "../../components/DiscoverAllToolbar";
import { DiscoverItemGridCard } from "../../components/DiscoverItemCard";
import { getDiscoverCategoryAction } from "../../actions";
import { isDiscoverCategory } from "../../lib/discover";
import type { gaming_hub } from "@/lib/client";

function DiscoverAllContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const category = isDiscoverCategory(categoryParam) ? categoryParam : "bilgisayar-web";
  const [items, setItems] = useState<gaming_hub.DiscoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await getDiscoverCategoryAction(category);
        if (res.data) setItems(res.data.items);
        else setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [category]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) return items;
    return items.filter((item) =>
      item.title.toLocaleLowerCase("tr-TR").includes(normalized)
    );
  }, [items, query]);

  function handleCategoryChange(next: gaming_hub.DiscoverCategory) {
    setQuery("");
    router.push(`/apps/gaming-hub/discover/all?category=${next}`);
  }

  return (
    <GamingHubShell
      activeMainTab="discover"
      onMainTabChange={() => router.push("/apps/gaming-hub")}
      onBack={() => router.push("/apps/gaming-hub")}
      showMainTabs={false}
    >
      <DiscoverAllToolbar
        category={category}
        query={query}
        onQueryChange={setQuery}
        onCategoryChange={handleCategoryChange}
      />

      {loading ? (
        <div className="text-center py-20 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-sm font-bold text-gray-500">
            {query.trim() ? "Aramana uygun oyun bulunamadı" : "Bu kategoride oyun yok"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {filteredItems.map((item) => (
            <DiscoverItemGridCard
              key={item.id}
              item={item}
              imagePadding={category === "bilgisayar-web" ? "relaxed" : "none"}
            />
          ))}
        </div>
      )}
    </GamingHubShell>
  );
}

export default function DiscoverAllPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      }
    >
      <DiscoverAllContent />
    </Suspense>
  );
}
