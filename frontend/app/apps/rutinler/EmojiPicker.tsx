"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { MagnifyingGlass, Clock } from "@phosphor-icons/react";
import emojiDataByGroup from "unicode-emoji-json/data-by-group.json";

const TR_COMMON_MAP: Record<string, string[]> = {
  "gül": ["smile", "grin", "laugh", "happy"],
  "kalp": ["heart", "love"],
  "yemek": ["food", "eat", "cook", "meal"],
  "su": ["water", "drink"],
  "spor": ["sport", "workout", "fitness", "gym"],
  "ev": ["house", "home"],
  "araba": ["car", "auto", "drive"],
  "bayrak": ["flag"],
  "hayvan": ["animal"],
  "kedi": ["cat"],
  "köpek": ["dog"],
  "saat": ["clock", "time", "watch"],
  "kitap": ["book", "read"],
  "uyku": ["sleep", "night", "bed"],
  "ateş": ["fire", "hot", "flame"],
  "yıldız": ["star", "sparkle"],
  "para": ["money", "cash", "bank", "coin"],
  "iş": ["work", "office", "laptop", "computer"],
  "müzik": ["music", "song", "guitar", "piano"],
  "telefon": ["phone", "mobile"],
  "sağlık": ["health", "hospital", "doctor", "pill"],
  "temizlik": ["clean", "sweep", "mop", "soap"],
  "kahve": ["coffee", "tea"],
  "güneş": ["sun", "hot", "sunny"],
  "ay": ["moon"],
  "yağmur": ["rain", "cloud"],
  "kar": ["snow", "cold"],
};

const RECENT_EMOJIS_KEY = "public_recent_emojis";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

/** Emoji grid content — rendered inside EmojiPickerSheet (Vaul NestedRoot). */
export function CustomEmojiPicker({ onSelect }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<string>("recent");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const groupIcons: Record<string, string> = {
    "Smileys & Emotion": "😀",
    "People & Body": "🏃",
    "Animals & Nature": "🐶",
    "Food & Drink": "🍔",
    "Travel & Places": "✈️",
    Activities: "⚽",
    Objects: "💡",
    Symbols: "❤️",
    Flags: "🏁",
  };

  const groups = useMemo(() => {
    return (emojiDataByGroup as any[]).map((g) => ({
      name: g.name,
      icon: groupIcons[g.name] || g.emojis[0].emoji,
    }));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentEmojis(parsed);
        setActiveGroup(parsed.length > 0 ? "recent" : groups[0]?.name || "recent");
      } catch {
        setActiveGroup(groups[0]?.name || "recent");
      }
    } else {
      setActiveGroup(groups[0]?.name || "recent");
    }
  }, [groups]);

  const saveRecentEmoji = (emoji: string) => {
    const newRecents = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(0, 21);
    setRecentEmojis(newRecents);
    localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(newRecents));
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top)
          );
        if (intersecting.length > 0) {
          setActiveGroup(intersecting[0].target.id.replace("emoji-group-", ""));
        }
      },
      {
        root: scrollContainer,
        threshold: [0, 0.1, 0.5, 1.0],
        rootMargin: "-10% 0px -70% 0px",
      }
    );

    const groupElems = scrollContainer.querySelectorAll("[id^='emoji-group-']");
    groupElems.forEach((g) => observer.observe(g));

    const handleScroll = () => {
      if (scrollContainer.scrollTop < 10) {
        setActiveGroup(recentEmojis.length > 0 ? "recent" : groups[0]?.name || "recent");
      }
    };
    scrollContainer.addEventListener("scroll", handleScroll);
    return () => {
      observer.disconnect();
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [search, recentEmojis.length, groups]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (emojiDataByGroup as any[])
      .map((group: any) => {
        const items = group.emojis.filter((item: any) => {
          if (!q) return true;
          const name = item.name.toLowerCase();
          const slug = item.slug.toLowerCase();
          const turkishMatch = Object.entries(TR_COMMON_MAP).some(([tr, ens]) => {
            if (q.includes(tr) || tr.includes(q)) {
              return ens.some((en) => name.includes(en) || slug.includes(en));
            }
            return false;
          });
          return name.includes(q) || slug.includes(q) || turkishMatch;
        });
        return { name: group.name, items };
      })
      .filter((group) => group.items.length > 0);
  }, [search]);

  const groupTranslations: Record<string, string> = {
    "Smileys & Emotion": "Suratlar & Duygular",
    "People & Body": "İnsanlar & Vücut",
    "Animals & Nature": "Hayvanlar & Doğa",
    "Food & Drink": "Yemek & İçecek",
    "Travel & Places": "Seyahat & Yerler",
    Activities: "Aktiviteler",
    Objects: "Nesneler",
    Symbols: "Semboller",
    Flags: "Bayraklar",
  };

  const scrollToGroup = (id: string) => {
    const element = document.getElementById(`emoji-group-${id}`);
    if (element && scrollRef.current) {
      const top = element.offsetTop - scrollRef.current.offsetTop;
      scrollRef.current.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[320px] overflow-hidden">
      <div className="p-3 border-b border-gray-50 bg-gray-50/30 shrink-0">
        <div className="relative">
          <MagnifyingGlass
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Emoji ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold outline-none focus:border-violet-400/40 placeholder:text-gray-400 placeholder:font-medium"
            autoFocus
          />
        </div>
      </div>

      {!search && (
        <div className="flex overflow-x-auto p-2 gap-1 border-b border-gray-50 bg-white scrollbar-hide shrink-0">
          <button
            type="button"
            onClick={() => scrollToGroup("recent")}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-lg transition-all ${
              activeGroup === "recent"
                ? "bg-violet-100 text-violet-600 scale-110"
                : "bg-gray-50 text-gray-500 hover:bg-violet-50 hover:text-violet-600"
            }`}
          >
            <Clock size={20} weight={activeGroup === "recent" ? "fill" : "bold"} />
          </button>
          {groups.map((group) => (
            <button
              key={group.name}
              type="button"
              onClick={() => scrollToGroup(group.name)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-lg transition-all ${
                activeGroup === group.name
                  ? "bg-violet-100 scale-110"
                  : "bg-gray-50 text-gray-500 hover:bg-violet-50 hover:text-violet-600"
              }`}
            >
              {group.icon}
            </button>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 scrollbar-hide space-y-4 overscroll-contain">
        {!search && recentEmojis.length > 0 && (
          <div id="emoji-group-recent" className="space-y-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
              <Clock size={12} weight="bold" />
              Son Kullanılanlar
            </h3>
            <div className="grid grid-cols-7 gap-1">
              {recentEmojis.map((emoji, i) => (
                <button
                  key={`recent-${i}`}
                  type="button"
                  onClick={() => {
                    saveRecentEmoji(emoji);
                    onSelect(emoji);
                  }}
                  className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-violet-50 rounded-xl transition-all active:scale-90 hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredData.map((group) => (
          <div key={group.name} id={`emoji-group-${group.name}`} className="space-y-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
              {groupTranslations[group.name] || group.name}
            </h3>
            <div className="grid grid-cols-7 gap-1">
              {group.items.map((item: any, i: number) => (
                <button
                  key={i}
                  type="button"
                  title={item.name}
                  onClick={() => {
                    saveRecentEmoji(item.emoji);
                    onSelect(item.emoji);
                  }}
                  className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-violet-50 rounded-xl transition-all active:scale-90 hover:scale-110"
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>
        ))}

        {filteredData.length === 0 && (
          <div className="py-12 text-center space-y-2">
            <p className="text-3xl">🔍</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              Emoji bulunamadı
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
