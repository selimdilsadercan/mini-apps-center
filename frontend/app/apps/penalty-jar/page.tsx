"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Spinner,
  Sparkle,
  Copy,
  Trash,
  Key,
  Shield,
  Coins,
  Trophy,
  User as UserIcon,
  House,
  X
} from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import { penalty_jar } from "@/lib/client";
import { getAppRootUrl } from "@/lib/apps";
import { Drawer } from "vaul";
import { useTranslations } from "@/contexts/LanguageContext";
import { PRESET_HABITS } from "./presets";

const client = createBrowserClient();

export default function PenaltyJarHome() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const t = useTranslations("penaltyJar");

  // State
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [lobbyName, setLobbyName] = useState("");
  const [penaltyType, setPenaltyType] = useState<"points" | "jar">("jar");
  const [pointStart, setPointStart] = useState(100);
  const [penaltyAmount, setPenaltyAmount] = useState(10);
  const [activeTab, setActiveTab] = useState<"odalar" | "skor" | "kavanoz" | "profil">("odalar");
  
  // Custom Rules
  const [rules, setRules] = useState<{ id: string; name: string; icon: string; penalty: number }[]>([]);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRulePenalty, setNewRulePenalty] = useState(10);

  // Friendship selection
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      fetchLobbies();
    }
  }, [isLoaded, user]);

  const showToastMsg = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLobbies = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await client.penalty_jar.getUserLobbies(user.id);
      setLobbies(res.lobbies || []);
      
      const friendsRes = await client.friendship.getFriends(user.id);
      setFriends(friendsRes.friends || []);
    } catch (err) {
      console.error(err);
      showToastMsg(t("errorRoomsLoaded"), "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId) 
        : [...prev, friendId]
    );
  };

  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!lobbyName.trim()) {
      showToastMsg(t("errorEnterRoomName"), "error");
      return;
    }
    if (rules.length === 0) {
      showToastMsg(t("errorMinRules"), "error");
      return;
    }

    try {
      setActionLoading(true);
      // Map custom/preset rules to backend representation (stripping icons for backend logic if needed, or keeping name)
      const mappedRules = rules.map(r => ({
        id: r.id,
        name: `${r.icon} ${r.name}`,
        penalty: r.penalty
      }));

      const res = await client.penalty_jar.createLobby({
        creatorId: user.id,
        name: lobbyName.trim(),
        penaltyType,
        currency: "Puan", // Always points
        pointStart,
        penaltyAmount,
        rules: mappedRules,
      });

      // Auto-join invited friends in a loop
      if (selectedFriendIds.length > 0) {
        for (const friendId of selectedFriendIds) {
          try {
            await client.penalty_jar.joinLobby({ userId: friendId, joinCode: res.joinCode });
          } catch (fErr) {
            console.error(`Failed auto-joining friend ${friendId}:`, fErr);
          }
        }
      }

      showToastMsg(t("successRoomCreated"), "success");
      setShowCreateDrawer(false);
      router.push(`/apps/penalty-jar/lobby/${res.lobbyId}`);
    } catch (err) {
      console.error(err);
      showToastMsg(t("errorRoomCreated"), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const togglePresetRule = (preset: typeof PRESET_HABITS[0]) => {
    const exists = rules.some(r => r.id === preset.id);
    if (exists) {
      setRules(rules.filter(r => r.id !== preset.id));
    } else {
      setRules([...rules, { id: preset.id, name: preset.name, icon: preset.icon, penalty: preset.defaultPenalty }]);
    }
  };

  const addCustomRule = () => {
    if (!newRuleName.trim()) return;
    const id = `custom_${Date.now()}`;
    setRules([...rules, { id, name: newRuleName.trim(), icon: "⚙️", penalty: newRulePenalty }]);
    setNewRuleName("");
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen bg-[#FAF9F7] items-center justify-center text-gray-900">
        <Spinner size={32} className="animate-spin text-fuchsia-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-gray-900 pb-28 font-sans relative overflow-x-hidden">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-100/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-rose-100/20 blur-[120px] rounded-full"></div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-bold transition-all ${
          toast.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="max-w-md mx-auto px-4 pt-6">
        
        {/* Navigation Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { window.location.href = getAppRootUrl(); }} 
              className="p-2 -ml-2 hover:bg-gray-150 rounded-full transition-colors active:scale-95 cursor-pointer text-gray-700"
            >
              <ArrowLeft size={24} color="#374151" />
            </button>
            <div>
              <h1 className="text-2xl font-[1000] text-gray-900 tracking-tight leading-none">
                {t("title")}
              </h1>
              <p className="text-xs text-gray-400 font-medium mt-1">{t("subtitle")}</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateDrawer(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-2xl font-bold text-xs shadow-md shadow-fuchsia-100 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            {t("createRoom")}
          </button>
        </header>

        {/* Info Card (minimized) */}
        <div className="bg-white/80 backdrop-blur-md border border-gray-150 rounded-3xl p-4 mb-8 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏺</span>
            <p className="text-[11px] text-gray-500 font-medium leading-normal max-w-[280px]">
              {t("onboardingDesc")}
            </p>
          </div>
        </div>

        {/* User's Lobbies */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={32} className="text-fuchsia-600 animate-spin" />
          </div>
        ) : lobbies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 bg-fuchsia-50 text-fuchsia-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
              <Users size={36} weight="duotone" />
            </div>
            <h2 className="font-extrabold text-lg text-gray-800 mb-2">{t("noActiveRooms")}</h2>
            <p className="text-gray-400 text-xs leading-relaxed max-w-[280px] mb-8">
              {t("noActiveRoomsDesc")}
            </p>
            <button
              onClick={() => setShowCreateDrawer(true)}
              className="py-3.5 px-6 bg-white hover:bg-gray-50 border border-gray-150 shadow-sm text-gray-700 rounded-2xl font-bold text-sm transition-all active:scale-95 cursor-pointer"
            >
              {t("createFirstRoom")}
            </button>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Sparkle size={16} className="text-fuchsia-500" weight="bold" />
              <h2 className="font-black text-gray-900 text-sm uppercase tracking-wider">{t("myRooms")}</h2>
              <span className="bg-fuchsia-50 text-fuchsia-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                {lobbies.length}
              </span>
            </div>

            <div className="grid gap-4">
              {lobbies.map((lb) => (
                <div 
                  key={lb.id}
                  onClick={() => router.push(`/apps/penalty-jar/lobby/${lb.id}`)}
                  className="bg-white/80 hover:bg-gray-50 border border-gray-150/70 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {/* Miniature Glass Jar */}
                    <div className="w-10 h-12 bg-fuchsia-50/20 border border-gray-300 rounded-b-xl rounded-t-md flex flex-col justify-end items-center p-0.5 relative shadow-inner shrink-0">
                      {/* Jar Cap */}
                      <div className="absolute top-0 w-6 h-1 bg-gray-500 border border-gray-300 rounded-full -mt-0.5" />
                      {/* Jar Neck */}
                      <div className="absolute top-0.5 w-5 h-1 bg-gray-200/50 border-x border-gray-300" />
                      {/* Liquid / Points Fill */}
                      <div 
                        className="w-full bg-fuchsia-500/20 border-t border-fuchsia-400/30 rounded-b-[10px] transition-all duration-1000 ease-out flex items-center justify-center"
                        style={{ 
                          height: `${Math.min(90, Math.max(20, ((lb.totalPoints || 0) / 200) * 80))}%` 
                        }}
                      >
                        <span className="text-[8px] font-black text-fuchsia-700 leading-none">
                          {lb.totalPoints || 0}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-800">{lb.name}</h4>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                        {t("commonJar")}
                      </p>
                    </div>
                  </div>
                  <div className="flex -space-x-2 overflow-hidden items-center">
                    {(lb.members || []).slice(0, 5).map((m: any, idx: number) => (
                      <div 
                        key={m.userId} 
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-fuchsia-50 overflow-hidden flex items-center justify-center text-[10px] font-black text-fuchsia-600 shadow-sm"
                        title={m.username || "Anonim"}
                        style={{ zIndex: 10 - idx }}
                      >
                        {m.avatar ? (
                          <img src={m.avatar} alt={m.username} className="h-full w-full object-cover" />
                        ) : (
                          (m.username || "A").slice(0, 1).toUpperCase()
                        )}
                      </div>
                    ))}
                    {(lb.members || []).length > 5 && (
                      <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[9px] font-black text-gray-500 shadow-sm z-0">
                        +{(lb.members || []).length - 5}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* CREATE LOBBY DRAWER */}
      <Drawer.Root open={showCreateDrawer} onOpenChange={setShowCreateDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[92dvh] outline-none z-[70] max-w-md mx-auto border-t border-gray-150 shadow-2xl flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto flex flex-col">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-200 mb-4" />

              <header className="flex justify-between items-center mb-4 shrink-0">
                <Drawer.Title className="font-black text-xl text-gray-900">{t("createPenaltyRoom")}</Drawer.Title>
                <button 
                  onClick={() => setShowCreateDrawer(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors active:scale-95 text-gray-500"
                >
                  <X size={20} weight="bold" />
                </button>
              </header>

              <form onSubmit={handleCreateLobby} className="flex-1 overflow-y-auto space-y-6 pr-1">
                
                <div>
                  <label className="font-extrabold text-xs text-gray-400 uppercase tracking-wider block mb-2">{t("roomName")}</label>
                  <input 
                    type="text" 
                    value={lobbyName}
                    onChange={(e) => setLobbyName(e.target.value)}
                    placeholder={t("roomNamePlaceholder")} 
                    className="w-full bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-fuchsia-500 font-bold text-gray-800 transition-colors"
                  />
                </div>



                {/* Friend Invites */}
                <div>
                  <label className="font-extrabold text-xs text-gray-400 uppercase tracking-wider block mb-2">
                    {t("inviteFriends")}
                  </label>
                  {friends.length === 0 ? (
                    <div className="p-3 bg-gray-50 border border-gray-150 rounded-2xl text-center text-xs text-gray-400 font-medium">
                      {t("emptyFriendList")}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                      {friends.map((friend) => {
                        const isSelected = selectedFriendIds.includes(friend.id);
                        return (
                          <button
                            key={friend.id}
                            type="button"
                            onClick={() => toggleFriendSelection(friend.id)}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all text-xs font-bold cursor-pointer ${
                              isSelected
                                ? "bg-fuchsia-50 border-fuchsia-500 text-fuchsia-950 shadow-sm"
                                : "bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-700"
                            }`}
                          >
                            <div className="w-6 h-6 rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                              {friend.avatar ? (
                                <img src={friend.avatar} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                "👤"
                              )}
                            </div>
                            <span className="truncate flex-1">{friend.username || "Anonim"}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Rules Selector */}
                <div>
                  <label className="font-extrabold text-xs text-gray-400 uppercase tracking-wider block mb-2">{t("selectHabits")}</label>
                  
                  {/* Presets formatted as interactive badges with icons */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {PRESET_HABITS.map(pr => {
                      const selected = rules.some(r => r.id === pr.id);
                      return (
                        <button
                          key={pr.id}
                          type="button"
                          onClick={() => togglePresetRule(pr)}
                          className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all text-xs font-bold cursor-pointer ${
                            selected
                              ? "bg-fuchsia-50 border-fuchsia-500 text-fuchsia-900 shadow-sm"
                              : "bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          <span className="text-lg">{pr.icon}</span>
                          <span className="truncate flex-1">{t(`habits.${pr.id}`)}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Rule Input */}
                  <div className="flex gap-1.5 mb-4">
                    <input 
                      type="text" 
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      placeholder={t("customRulePlaceholder")} 
                      className="flex-1 bg-gray-50 border border-gray-150 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-fuchsia-500 font-medium text-gray-800 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={addCustomRule}
                      className="px-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-2xl font-bold text-xs transition-all active:scale-95 cursor-pointer"
                    >
                      {t("add")}
                    </button>
                  </div>

                  {/* Selected Active Rules List */}
                  {rules.length > 0 && (
                    <div className="space-y-1.5 bg-gray-50 p-3 rounded-2xl border border-gray-150/70">
                      {rules.map((rule) => (
                        <div key={rule.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-gray-150">
                          <div className="flex items-center gap-2">
                            <span>{rule.icon || "⚙️"}</span>
                            <span className="text-xs text-gray-700 font-bold">
                              {PRESET_HABITS.some(p => p.id === rule.id) ? t(`habits.${rule.id}`) : rule.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-fuchsia-600 font-black">
                              {t("points", { points: rule.penalty })}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeRule(rule.id)}
                              className="text-gray-400 hover:text-rose-500 transition-colors"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-4 shrink-0">
                  <button
                    type="submit"
                    disabled={actionLoading || rules.length === 0}
                    className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:pointer-events-none text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md shadow-fuchsia-100"
                  >
                    {actionLoading ? (
                      <Spinner size={18} className="animate-spin" />
                    ) : (
                      t("createAndStart")
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Modern App Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-gray-150 py-4 px-8 flex justify-between items-center z-40 rounded-t-[2rem] shadow-lg">
        <button 
          onClick={() => setActiveTab("odalar")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "odalar" ? "text-fuchsia-600 scale-105" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <House size={20} weight={activeTab === "odalar" ? "fill" : "regular"} />
          <span className="text-[8px] font-black tracking-wider uppercase">{t("navRooms")}</span>
        </button>

        <button 
          onClick={() => setActiveTab("skor")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "skor" ? "text-fuchsia-600 scale-105" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Trophy size={20} weight={activeTab === "skor" ? "fill" : "regular"} />
          <span className="text-[8px] font-black tracking-wider uppercase">{t("navScore")}</span>
        </button>

        <button 
          onClick={() => setActiveTab("kavanoz")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "kavanoz" ? "text-fuchsia-600 scale-105" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Coins size={20} weight={activeTab === "kavanoz" ? "fill" : "regular"} />
          <span className="text-[8px] font-black tracking-wider uppercase">{t("navJar")}</span>
        </button>

        <button 
          onClick={() => setActiveTab("profil")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "profil" ? "text-fuchsia-600 scale-105" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <UserIcon size={20} weight={activeTab === "profil" ? "fill" : "regular"} />
          <span className="text-[8px] font-black tracking-wider uppercase">{t("navProfile")}</span>
        </button>
      </nav>

    </div>
  );
}
