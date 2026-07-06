"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  ListChecks,
  Plus,
  Trash,
  CaretLeft,
  Basket,
  ShareNetwork,
  UserMinus,
  Copy,
  X,
  Check,
} from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import { eksik_var } from "@/lib/client";

const client = createBrowserClient();

import COMMON_ITEMS from "./common_items.json";

export default function EksikVarPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [items, setItems] = useState<eksik_var.MissingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sharing states
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [sharedMembers, setSharedMembers] = useState<eksik_var.SharedMember[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingShareData, setLoadingShareData] = useState(false);
  const [copied, setCopied] = useState(false);

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showShareSheet && user) {
      fetchShareData();
    }
  }, [showShareSheet, user]);

  const fetchShareData = async () => {
    if (!user) return;
    try {
      setLoadingShareData(true);
      const membersRes = await client.eksik_var.getSharedMembers(user.id);
      setSharedMembers(membersRes.members || []);

      const friendsRes = await client.friendship.getFriends(user.id);
      setFriends(friendsRes.friends || []);
    } catch (error) {
      console.error("fetchShareData error:", error);
    } finally {
      setLoadingShareData(false);
    }
  };

  const handleShareWithFriend = async (friendUserId: string) => {
    if (!user) return;
    try {
      await client.eksik_var.shareWithFriend({
        userId: user.id,
        friendUserId: friendUserId,
      });
      await fetchShareData();
      await fetchItems();
    } catch (error) {
      console.error("handleShareWithFriend error:", error);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!user) return;
    try {
      await client.eksik_var.removeSharedMember({
        userId: user.id,
        targetUserId: targetUserId,
      });
      await fetchShareData();
      await fetchItems();
    } catch (error) {
      console.error("handleRemoveMember error:", error);
    }
  };

  const handleCreateInvite = async () => {
    if (!user) return;
    try {
      const res = await client.eksik_var.createShareInvite({ userId: user.id });
      if (res.inviteId) {
        const inviteUrl = `${window.location.origin}/apps/eksik-var/s?t=${res.inviteId}`;
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("handleCreateInvite error:", error);
    }
  };

  useEffect(() => {
    if (isUserLoaded && user) {
      fetchItems();
    } else if (isUserLoaded && !user) {
      setLoading(false);
    }
  }, [isUserLoaded, user]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      if (!user) {
        setItems([]);
        return;
      }
      const response = await client.eksik_var.getItems(user.id);
      setItems(response.items || []);
    } catch (error) {
      console.error("fetchItems error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }
    const filtered = COMMON_ITEMS.filter(item =>
      item.toLocaleLowerCase("tr-TR").includes(val.toLocaleLowerCase("tr-TR"))
    ).slice(0, 5);
    setSuggestions(filtered);
    setShowSuggestions(true);
  };

  const handleAddItem = async (nameToAdd: string) => {
    const trimmed = nameToAdd.trim();
    if (!trimmed) return;
    if (!user) {
      return;
    }

    if (items.some(item => !item.is_used && item.name.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }

    try {
      const response = await client.eksik_var.addItem({
        userId: user.id,
        name: trimmed
      });
      if (response.item) {
        setItems(prev => [response.item!, ...prev]);
      }
      setInputValue("");
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (error) {
      console.error("handleAddItem error:", error);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!user) return;
    try {
      await client.eksik_var.deleteItem(id, { userId: user.id });
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("handleDeleteItem error:", error);
    }
  };

  const handleToggleUsed = async (id: string, name: string, currentlyUsed: boolean) => {
    if (!user) return;
    try {
      const response = await client.eksik_var.toggleItemUsed(id, { userId: user.id });
      if (response.item) {
        setItems(prev => prev.map(item => item.id === id ? response.item! : item));
      }
    } catch (error) {
      console.error("handleToggleUsed error:", error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 selection:bg-emerald-100">


      <main className="flex-1 px-4 py-8 pb-32 max-w-xl mx-auto w-full">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => window.location.href = getAppRootUrl()}
            className="group flex items-center gap-2 text-gray-500 text-xs font-bold hover:text-gray-900 transition-all bg-white px-3.5 py-2 rounded-xl border border-gray-200/60 h-9 shadow-sm active:scale-95"
          >
            <CaretLeft size={14} weight="bold" className="text-emerald-500 shrink-0" />
          </button>

          {user && (
            <button
              onClick={() => setShowShareSheet(true)}
              className="group flex items-center gap-2 text-gray-500 text-xs font-bold hover:text-emerald-600 hover:bg-emerald-50/30 transition-all bg-white px-3.5 py-2 rounded-xl border border-gray-200/60 h-9 shadow-sm active:scale-95"
            >
              <ShareNetwork size={14} weight="bold" className="text-emerald-500 shrink-0" />
              <span>Listeyi Paylaş</span>
            </button>
          )}
        </div>

        {/* Hero Section */}
        <div className="mb-6 mt-2">
          <h1 className="text-2xl font-black tracking-tight uppercase leading-none text-gray-900 flex items-center gap-2">
            <ListChecks size={26} weight="fill" className="text-emerald-500" />
            Eksik <span className="text-emerald-500">Var!</span>
          </h1>
        </div>

        {/* Input & Autocomplete */}
        {user && (
          <div className="mb-6 relative" ref={suggestionsRef}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddItem(inputValue);
                }}
                onFocus={() => {
                  if (inputValue.trim()) setShowSuggestions(true);
                }}
                placeholder="Eksik ürün yazın..."
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/40 outline-none transition-all placeholder:text-gray-400 text-gray-900 shadow-sm"
              />
              <button
                onClick={() => handleAddItem(inputValue)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all shrink-0"
              >
                <Plus size={18} weight="bold" />
              </button>
            </div>

            {/* Autocomplete suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[3.2rem] bg-white border border-gray-200/50 rounded-xl shadow-lg overflow-hidden z-30">
                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  Öneriler
                </div>
                {suggestions.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleAddItem(item)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-bold text-gray-700 hover:text-emerald-600 transition-all flex items-center justify-between border-b border-gray-50 last:border-b-0"
                  >
                    <span>{item}</span>
                    <Plus size={14} weight="bold" className="text-gray-300" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            Yükleniyor...
          </div>
        ) : !user ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/50 flex flex-col items-center justify-center p-6 shadow-sm">
            <Basket size={40} className="text-gray-200 mb-4" />
            <p className="text-sm font-bold text-gray-400">Eksik listeni görebilmek için giriş yapmalısın.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/50 flex flex-col items-center justify-center p-6 shadow-sm">
            <Basket size={40} className="text-gray-200 mb-4" />
            <p className="text-sm font-bold text-gray-400 mb-1">Alışveriş listen boş.</p>
            <p className="text-xs text-gray-300">Yukarıdaki alana yazarak eksiklerini ekleyebilirsin.</p>
          </div>
        ) : (() => {
          const activeItems = items.filter(i => !i.is_used);
          const usedItems = items.filter(i => i.is_used);
          return (
          <>
            {/* Active Items Section */}
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Eksiklerim</span>
              <span className="text-xs font-black text-emerald-600">{activeItems.length} ürün</span>
            </div>

            {activeItems.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-200/50 shadow-sm mb-8">
                <Basket size={32} className="text-gray-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-400">Tüm eksikler alınmış!</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 mb-8">
                {activeItems.map((item) => {
                  const isToday = new Date(item.created_at).toDateString() === new Date().toDateString();
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleToggleUsed(item.id, item.name, false)}
                      className="bg-white rounded-xl border border-gray-200/50 relative flex items-center justify-center px-3 py-8 group hover:border-emerald-500/30 hover:shadow-md transition-all shadow-sm overflow-hidden active:scale-95 cursor-pointer text-left w-full"
                    >
                      {isToday && (
                        <span className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[7px] font-black uppercase tracking-wider px-1 py-0.5 rounded leading-none">
                          Yeni
                        </span>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id, item.name); }}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <Trash size={12} weight="bold" />
                      </button>

                      <h3 className="text-[13px] font-bold text-gray-900 text-center leading-tight line-clamp-2">
                        {item.name}
                      </h3>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Used Items Section */}
            {usedItems.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Son Kullanılan</span>
                  <span className="text-xs font-black text-gray-400">{usedItems.length} ürün</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {usedItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleToggleUsed(item.id, item.name, true)}
                      className="bg-gray-50 rounded-xl border border-gray-200/40 relative flex items-center justify-center px-3 py-8 group hover:border-emerald-500/20 transition-all overflow-hidden active:scale-95 cursor-pointer text-left w-full"
                    >
                      {/* Delete */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id, item.name); }}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <Trash size={12} weight="bold" />
                      </button>

                      <h3 className="text-[13px] font-bold text-gray-400 text-center leading-tight line-clamp-2 line-through">
                        {item.name}
                      </h3>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
          );
        })()}
      </main>

      {/* Share Bottom Sheet */}
      {showShareSheet && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 z-40 transition-opacity" 
            onClick={() => setShowShareSheet(false)}
          />
          
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-white rounded-t-3xl border-t border-gray-200/60 z-50 p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
                <ShareNetwork size={20} className="text-emerald-500" />
                Listeyi Paylaş
              </h2>
              <button 
                onClick={() => setShowShareSheet(false)}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all active:scale-95"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Invite Link Section */}
            <div className="mb-6 bg-emerald-50/40 rounded-2xl p-4 border border-emerald-500/10">
              <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-1.5">Davet Linki</h3>
              <p className="text-xs text-emerald-600/80 mb-3 leading-relaxed">
                Bu linki gönderdiğin kişiler alışveriş listene ortak olabilir, yeni ürün ekleyip silebilirler.
              </p>
              <button
                onClick={handleCreateInvite}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md shadow-emerald-900/10"
              >
                {copied ? (
                  <>
                    <Check size={14} weight="bold" />
                    <span>Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} weight="bold" />
                    <span>Davet Linkini Kopyala</span>
                  </>
                )}
              </button>
            </div>

            {/* Loading state for sharing data */}
            {loadingShareData ? (
              <div className="text-center py-8 text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                Yükleniyor...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Shared Members List */}
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Ortak Üyeler</h3>
                  {sharedMembers.length === 0 ? (
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl text-center border border-dashed border-gray-200">
                      Bu listeyi henüz kimseyle paylaşmadın.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sharedMembers.map((member) => (
                        <div 
                          key={member.member_id}
                          className="flex items-center justify-between p-3 bg-gray-50/60 rounded-xl border border-gray-100"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {member.avatar_url ? (
                              <img 
                                src={member.avatar_url} 
                                alt={member.username || ""} 
                                className="w-7 h-7 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-[10px] font-black uppercase">
                                {member.username?.slice(0, 2) || "Ü"}
                              </div>
                            )}
                            <span className="text-xs font-bold text-gray-800 truncate">
                              @{member.username || "Kullanıcı"}
                            </span>
                            {member.is_owner && (
                              <span className="bg-gray-200 text-gray-600 text-[8px] font-black px-1.5 py-0.5 rounded leading-none">
                                Sahibi
                              </span>
                            )}
                          </div>

                          {!member.is_owner && (
                            <button
                              onClick={() => handleRemoveMember(member.member_id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
                              title="Paylaşımı Sonlandır"
                            >
                              <UserMinus size={14} weight="bold" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Direct Share with Friends */}
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Arkadaşlarından Ekle</h3>
                  {friends.length === 0 ? (
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl text-center border border-dashed border-gray-200">
                      Arkadaş listen boş.
                    </p>
                  ) : (
                    (() => {
                      // Filter out friends who are already shared members
                      const unsharedFriends = friends.filter(
                        (friend) => !sharedMembers.some((m) => m.member_id === friend.id)
                      );
                      
                      if (unsharedFriends.length === 0) {
                        return (
                          <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl text-center border border-dashed border-gray-200">
                            Tüm arkadaşların listene zaten ortak.
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {unsharedFriends.map((friend) => (
                            <div 
                              key={friend.id}
                              className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-150"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {friend.avatar ? (
                                  <img 
                                    src={friend.avatar} 
                                    alt={friend.username || ""} 
                                    className="w-7 h-7 rounded-full object-cover border border-gray-200"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[10px] font-black uppercase">
                                    {friend.username?.slice(0, 2) || "A"}
                                  </div>
                                )}
                                <span className="text-xs font-bold text-gray-800 truncate">
                                  @{friend.username || "Arkadaş"}
                                </span>
                              </div>

                              <button
                                onClick={() => handleShareWithFriend(friend.id)}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
                              >
                                Paylaş
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
