"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { 
  Plus, 
  CaretLeft, 
  CaretRight,
  Trash,
  UserPlus,
  Users,
  SquaresFour
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { budget, friendship } from "@/lib/client";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

const client = createBrowserClient();

export default function BudgetPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [projects, setProjects] = useState<budget.Project[]>([]);
  const [friends, setFriends] = useState<friendship.FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const router = useRouter();
  const { locale } = useLanguage();

  const isTr = locale === "tr";

  const getCurrencySymbol = (code?: string) => {
    if (code === 'USD') return '$';
    if (code === 'EUR') return '€';
    return '₺';
  };

  const formatVal = (val: number) => {
    return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const getProjectRangeLabel = (startStr?: string | null, endStr?: string | null) => {
    if (!startStr || !endStr) return null;
    const start = new Date(startStr);
    const end = new Date(endStr);
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = start.toLocaleDateString(isTr ? 'tr-TR' : 'en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString(isTr ? 'tr-TR' : 'en-US', { month: 'short' });
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${startDay} - ${endDay} ${startMonth}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  };

  const t = {
    title: isTr ? "bütçe" : "budget",
    newBudget: isTr ? "Bütçe Ekle" : "Add Budget",
    loadingText: isTr ? "Yükleniyor..." : "Loading...",
    emptyState: isTr ? "Henüz bir bütçe oluşturmadın" : "No budgets created yet",
    members: isTr ? "katılımcı" : "members",
    currency: isTr ? "Para Birimi" : "Currency",
    groupType: isTr ? "Grup Tipi" : "Group Type",
    titleInput: isTr ? "Başlık" : "Title",
    titlePlaceholder: isTr ? "Örneğin: Şehir Gezisi, Yılbaşı" : "e.g. City trip, Camp",
    membersInput: isTr ? "Katılımcılar" : "Participants",
    save: isTr ? "Bütçe Oluştur" : "Create Budget",
    back: isTr ? "Geri Dön" : "Go Back"
  };

  useEffect(() => {
    if (isUserLoaded) {
      fetchProjects();
      fetchFriends();
    }
  }, [isUserLoaded, user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      if (!user) {
        setProjects([]);
        return;
      }

      // Fetch internal user ID if not already fetched
      if (!internalUserId) {
        const userRes = await client.users.getUserByClerkId(user.id);
        if (userRes.user) {
          setInternalUserId(userRes.user.id);
        }
      }

      const response = await client.budget.getUserProjects(user.id);
      setProjects(response.projects);
    } catch (error) {
      console.error(error);
      toast.error(isTr ? "Hata oluştu" : "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      if (!user) return;
      // Fetch user's friends list
      const response = await client.friendship.getFriends(user.id);
      setFriends(response.friends || []);
    } catch (error) {
      console.error("fetchFriends error:", error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text font-sans selection:bg-blue-100/30 overflow-x-hidden">
      <Toaster position="top-center" />

      {/* Standard Header */}
      <header className="sticky top-0 z-30 bg-app-header backdrop-blur-md border-b border-app-border/60">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { window.location.href = getAppRootUrl(); }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border/60 active:scale-95 cursor-pointer"
            >
              <CaretLeft size={14} weight="bold" className="text-[#EC4899]" />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5">
              <SquaresFour size={18} weight="fill" className="text-[#EC4899] shrink-0" />
              <span className="truncate">
                {t.title}
              </span>
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-6 pb-36 max-w-xl mx-auto w-full flex flex-col relative z-10">
        {/* Projects List */}
        <div className="flex-1 space-y-4">
          {loading ? (
             <div className="py-20 text-center text-app-muted text-sm font-medium animate-pulse">
               {t.loadingText}
             </div>
          ) : projects.length === 0 ? (
            <div className="py-24 text-center bg-app-surface rounded-3xl border border-app-border p-6 flex flex-col items-center justify-center shadow-sm">
              <span className="text-4xl mb-4">🏖️</span>
              <p className="text-app-muted text-sm font-semibold">{t.emptyState}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...projects].sort((a, b) => {
                const dateA = a.startDate || a.createdAt;
                const dateB = b.startDate || b.createdAt;
                return new Date(dateB).getTime() - new Date(dateA).getTime();
              }).map((project) => {
                const dateRange = getProjectRangeLabel(project.startDate, project.endDate);
                return (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/apps/budget/project?id=${project.id}`)}
                    className="bg-app-surface hover:bg-app-surface-muted border border-app-border rounded-[1.6rem] p-4 flex justify-between items-center transition-all cursor-pointer active:scale-[0.98] group shadow-sm animate-fade-in"
                  >
                    <div className="flex items-center gap-4">
                      {/* Beach umbrella icon wrapper */}
                      <div className="w-14 h-14 rounded-2xl bg-app-surface-muted border border-app-border flex items-center justify-center text-3xl shadow-inner select-none">
                        {project.emoji || "🏖️"}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-app-text tracking-tight leading-tight group-hover:text-[#EC4899] transition-colors">
                          {project.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-app-muted">
                          <span className="flex items-center gap-1">
                            <Users size={13} />
                            {project.memberCount || 1} {t.members}
                          </span>
                          {dateRange && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-app-border" />
                              <span>{dateRange}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {project.userShare !== undefined && Number(project.userShare) > 0 && (
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-app-text">
                            {getCurrencySymbol(project.currency)}{formatVal(Number(project.userShare))}
                          </span>
                        </div>
                      )}
                      <div className="text-app-muted group-hover:text-app-text transition-colors pr-1">
                        <CaretRight size={18} weight="bold" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* FAB (Floating Plus Button) */}
      <div className="fixed bottom-10 left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-[50]">
        <Drawer.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <Drawer.Trigger asChild>
            <button className="pointer-events-auto bg-[#EC4899] hover:bg-pink-600 text-white w-14 h-14 rounded-full shadow-[0_10px_25px_rgba(236,72,153,0.25)] flex items-center justify-center active:scale-[0.9] transition-all hover:scale-105 cursor-pointer">
              <Plus size={28} weight="bold" />
            </button>
          </Drawer.Trigger>
          <span className="text-[10px] text-app-muted font-bold uppercase tracking-widest mt-2 select-none pointer-events-none">{t.newBudget}</span>
          
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
            <Drawer.Content className="bg-app-surface text-app-text flex flex-col rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[70] max-w-md mx-auto border-t border-app-border">
              <div className="p-6 overflow-y-auto">
                <div className="mx-auto w-12 h-1 rounded-full bg-app-border mb-6" />
                <Drawer.Title className="text-xl font-black mb-6 flex items-center gap-2 text-app-text">
                  <span className="text-[#EC4899]">🏖️</span> {isTr ? "Yeni Bütçe" : "New Budget"}
                </Drawer.Title>
                
                <CreateProjectForm friends={friends} onComplete={() => {
                  setIsCreateOpen(false);
                  fetchProjects();
                }} t={t} isTr={isTr} />
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>
    </div>
  );
}

function CreateProjectForm({ 
  friends, 
  onComplete, 
  t, 
  isTr 
}: { 
  friends: friendship.FriendUser[]; 
  onComplete: () => void; 
  t: any; 
  isTr: boolean;
}) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    name: "",
    currency: "TRY",
    groupType: "trip",
    guestNameInput: "",
    startDate: "",
    endDate: "",
    emoji: "🏖️"
  });
  
  // Explicitly seed the creator user as a member
  const [membersList, setMembersList] = useState<string[]>([]);

  // Track checked state of loaded friends list
  const [selectedFriends, setSelectedFriends] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [dbUsername, setDbUsername] = useState<string>("");

  // Fetch dbUsername and auto-seed current logged-in user to members list
  useEffect(() => {
    const getUsername = async () => {
      if (!user) return;
      try {
        const res = await client.users.getUserByClerkId(user.id);
        console.log("BUDGET USER RESPONSE:", res);
        const name = res.user?.username || "Ben";
        setDbUsername(name);
        setMembersList(prev => {
          if (prev.length === 0 || prev[0] === "Ben") {
            return [name];
          }
          return prev;
        });
      } catch (err) {
        console.error(err);
        setDbUsername("Ben");
        setMembersList(["Ben"]);
      }
    };
    getUsername();
  }, [user]);

  const toggleFriendSelection = (friendUsername: string) => {
    const isSelected = !selectedFriends[friendUsername];
    setSelectedFriends(prev => ({
      ...prev,
      [friendUsername]: isSelected
    }));

    if (isSelected) {
      setMembersList(prev => [...prev, friendUsername]);
    } else {
      setMembersList(prev => prev.filter(name => name !== friendUsername));
    }
  };

  const handleAddGuestMember = () => {
    const name = formData.guestNameInput.trim();
    if (!name) return;
    if (membersList.includes(name)) {
      toast.error(isTr ? "Bu katılımcı zaten ekli!" : "Participant already added!");
      return;
    }
    setMembersList(prev => [...prev, name]);
    setFormData(prev => ({ ...prev, guestNameInput: "" }));
  };

  const handleRemoveMember = (nameToRemove: string) => {
    // Prevent removing yourself
    const selfName = dbUsername || "Ben";
    if (nameToRemove === selfName) {
      toast.error(isTr ? "Kendinizi gruptan çıkaramazsınız!" : "You cannot remove yourself!");
      return;
    }
    setMembersList(prev => prev.filter(name => name !== nameToRemove));
    
    // Also toggle off in friends checkbox list if it was a friend
    if (selectedFriends[nameToRemove]) {
      setSelectedFriends(prev => ({ ...prev, [nameToRemove]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (membersList.length < 1) {
      toast.error(isTr ? "En az 1 katılımcı olmalıdır!" : "Must have at least 1 member!");
      return;
    }

    try {
      setLoading(true);
      const selfName = dbUsername || "Ben";
      const finalGuests = membersList.filter(name => name !== selfName);

      if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        toast.error(isTr ? "Başlangıç tarihi bitiş tarihinden sonra olamaz!" : "Start date cannot be after end date!");
        return;
      }

      await client.budget.createProject({
        creatorClerkId: user.id,
        name: formData.name,
        currency: formData.currency,
        groupType: formData.groupType,
        memberNames: finalGuests,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        emoji: formData.emoji
      });

      toast.success(isTr ? "Bütçe başarıyla oluşturuldu" : "Budget created successfully");
      onComplete();
    } catch (err) {
      console.error(err);
      toast.error("Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-8 text-sm text-app-text">
      {/* Emoji Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-app-muted uppercase tracking-wider pl-1">
          {isTr ? "İkon Seç" : "Select Icon"}
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
          {["🏖️", "🏠", "🎟️", "🚗", "🍔", "🛒", "🛍️", "🍿", "⛺", "💵", "🏔️", "✈️", "🚢", "🎉", "💼", "🎓", "🏥", "🚲", "🎸", "⚽"].map((emo) => (
            <button
              key={emo}
              type="button"
              onClick={() => setFormData({ ...formData, emoji: emo })}
              className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center text-2xl transition-all active:scale-90 ${
                formData.emoji === emo 
                  ? "bg-[#EC4899]/10 border-[#EC4899] shadow-sm" 
                  : "bg-app-surface-muted border-app-border grayscale-[0.5] opacity-60 hover:opacity-100 hover:grayscale-0"
              }`}
            >
              {emo}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-app-muted uppercase tracking-wider pl-1">
          {t.titleInput}
        </label>
        <input 
          required 
          placeholder={t.titlePlaceholder} 
          value={formData.name} 
          onChange={e => setFormData({...formData, name: e.target.value})} 
          className="w-full bg-app-surface-muted border border-app-border rounded-xl p-3 text-app-text focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20 focus:border-[#EC4899] transition-all font-semibold" 
        />
      </div>

      {/* Currency & Type */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-app-muted uppercase tracking-wider pl-1">
            {t.currency}
          </label>
          <select 
            value={formData.currency} 
            onChange={e => setFormData({...formData, currency: e.target.value})} 
            className="w-full bg-app-surface-muted border border-app-border rounded-xl p-3 text-app-text focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20 focus:border-[#EC4899] transition-all font-semibold"
          >
            <option value="TRY">Türk Lirası (₺)</option>
            <option value="USD">Dolar ($)</option>
            <option value="EUR">Euro (€)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-app-muted uppercase tracking-wider pl-1">
            {t.groupType}
          </label>
          <select 
            value={formData.groupType} 
            onChange={e => setFormData({...formData, groupType: e.target.value})} 
            className="w-full bg-app-surface-muted border border-app-border rounded-xl p-3 text-app-text focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20 focus:border-[#EC4899] transition-all font-semibold"
          >
            <option value="trip">{isTr ? "Seyahat" : "Trip"}</option>
            <option value="home">{isTr ? "Ev Gideri" : "Home"}</option>
            <option value="event">{isTr ? "Etkinlik" : "Event"}</option>
            <option value="other">{isTr ? "Diğer" : "Other"}</option>
          </select>
        </div>
      </div>

      {/* Date Range (Optional) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-app-muted uppercase tracking-wider pl-1">
            {isTr ? "Başlangıç Tarihi (Opsiyonel)" : "Start Date (Optional)"}
          </label>
          <input 
            type="date" 
            value={formData.startDate} 
            onChange={e => setFormData({...formData, startDate: e.target.value})} 
            className="w-full bg-app-surface-muted border border-app-border rounded-xl p-3 text-app-text focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20 focus:border-[#EC4899] transition-all font-semibold text-xs cursor-pointer" 
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-app-muted uppercase tracking-wider pl-1">
            {isTr ? "Bitiş Tarihi (Opsiyonel)" : "End Date (Optional)"}
          </label>
          <input 
            type="date" 
            value={formData.endDate} 
            onChange={e => setFormData({...formData, endDate: e.target.value})} 
            className="w-full bg-app-surface-muted border border-app-border rounded-xl p-3 text-app-text focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20 focus:border-[#EC4899] transition-all font-semibold text-xs cursor-pointer" 
          />
        </div>
      </div>

      {/* Members List Box (like Tricount layout) */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-app-muted uppercase tracking-wider pl-1">
          {t.membersInput}
        </label>
        <div className="border border-app-border rounded-xl overflow-hidden divide-y divide-app-border/40 bg-app-surface-muted">
          {membersList.map((name) => (
            <div key={name} className="flex justify-between items-center p-3 bg-app-surface">
              <span className="text-xs font-bold text-app-text flex items-center gap-2">
                {user && name === (dbUsername || "Ben") ? (
                  <>
                    <img 
                      src={user.imageUrl} 
                      alt={name} 
                      className="w-5 h-5 rounded-full object-cover border border-app-border" 
                    />
                    <span>{name} (Ben)</span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-app-surface-muted border border-app-border flex items-center justify-center font-bold text-app-muted text-[9px]">
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <span>{name}</span>
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveMember(name)}
                className="text-app-muted hover:text-red-500 p-1 active:scale-95 transition-all cursor-pointer"
              >
                <Trash size={15} />
              </button>
            </div>
          ))}

          {/* Quick guest add row */}
          <div className="flex bg-app-surface-muted p-2 gap-2">
            <input
              placeholder={isTr ? "Misafir adı..." : "Guest name..."}
              value={formData.guestNameInput}
              onChange={e => setFormData({ ...formData, guestNameInput: e.target.value })}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddGuestMember();
                }
              }}
              className="flex-1 bg-app-surface border border-app-border rounded-lg px-3 py-1.5 text-xs text-app-text focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddGuestMember}
              className="bg-[#EC4899]/10 border border-[#EC4899]/30 text-[#EC4899] rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-[#EC4899]/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              <UserPlus size={14} />
              <span>{isTr ? "Ekle" : "Add"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Friends Selection list */}
      {friends.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-app-muted uppercase tracking-wider pl-1">
            {isTr ? "Arkadaşlarından Hızlı Ekle" : "Quick Add Friends"}
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
            {friends.map(friend => {
              const name = friend.username || "Friend";
              const isSelected = !!selectedFriends[name];
              return (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => toggleFriendSelection(name)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${isSelected ? "bg-[#EC4899]/10 border-[#EC4899] text-[#EC4899] shadow-sm" : "bg-app-surface border-app-border text-app-muted hover:bg-app-surface-muted"}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#EC4899] bg-[#EC4899]' : 'border-app-border'}`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                  </div>
                  {friend.avatar ? (
                    <img src={friend.avatar} alt={name} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-app-surface-muted flex items-center justify-center text-[9px] font-bold text-app-muted">
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-semibold truncate">{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <motion.button 
        disabled={loading} 
        whileTap={{ scale: 0.98 }} 
        className="w-full bg-[#EC4899] hover:bg-pink-600 text-white p-4 rounded-xl font-bold shadow-md h-12 flex items-center justify-center gap-2 active:scale-95 transition-all mt-4 cursor-pointer"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        ) : (
          <span>{t.save}</span>
        )}
      </motion.button>
    </form>
  );
}
