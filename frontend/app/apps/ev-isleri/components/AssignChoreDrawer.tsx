"use client";

import { useMemo, useState } from "react";
import { Drawer } from "vaul";
import { X, MagnifyingGlass } from "@phosphor-icons/react";
import COMMON_CHORES from "../common_chores.json";
import type { BoardMember, ChoreTemplate } from "../types";

const ALL_CHORES: ChoreTemplate[] = COMMON_CHORES.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    category: group.category,
  }))
);

export default function AssignChoreDrawer({
  open,
  onClose,
  members,
  onAssign,
}: {
  open: boolean;
  onClose: () => void;
  members: BoardMember[];
  onAssign: (chore: ChoreTemplate, assigneeClerkId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedChore, setSelectedChore] = useState<ChoreTemplate | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    if (!q) return ALL_CHORES;
    return ALL_CHORES.filter(
      (c) =>
        c.name.toLocaleLowerCase("tr-TR").includes(q) ||
        (c.category ?? "").toLocaleLowerCase("tr-TR").includes(q)
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, ChoreTemplate[]>();
    for (const chore of filtered) {
      const cat = chore.category ?? "Diğer";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(chore);
    }
    return [...map.entries()];
  }, [filtered]);

  function handleClose() {
    setQuery("");
    setSelectedChore(null);
    onClose();
  }

  return (
    <Drawer.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[85vh] flex flex-col outline-none">
          <div className="mx-auto w-10 h-1 rounded-full bg-gray-200 mt-2 mb-1 shrink-0" />
          <div className="px-4 pb-2 flex items-center justify-between shrink-0">
            <Drawer.Title className="text-sm font-black text-gray-900">
              {selectedChore ? "Kime atanacak?" : "Görev seç"}
            </Drawer.Title>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500"
            >
              <X size={14} weight="bold" />
            </button>
          </div>

          {!selectedChore ? (
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <div className="relative mb-3">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Görev ara..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm font-medium outline-none focus:border-teal-200"
                />
              </div>

              <div className="space-y-4">
                {grouped.map(([category, chores]) => (
                  <div key={category}>
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">
                      {category}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {chores.map((chore) => (
                        <button
                          key={chore.slug}
                          onClick={() => setSelectedChore(chore)}
                          className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-800 active:scale-95 transition-all hover:border-teal-200"
                        >
                          <span className="mr-1">{chore.icon}</span>
                          {chore.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 text-xs font-bold text-teal-900 mb-3">
                {selectedChore.icon} {selectedChore.name}
              </div>
              {members.map((member) => (
                <button
                  key={member.clerkId}
                  onClick={() => {
                    onAssign(selectedChore, member.clerkId);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-teal-200 active:scale-[0.99] transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-black">
                        {(member.username ?? "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-900 truncate">
                    {member.username ?? "Kullanıcı"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
