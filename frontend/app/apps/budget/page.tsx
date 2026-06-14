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
  Users
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { budget, friendship } from "@/lib/client";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

const client = createBrowserClient();

export default function BudgetDashboard() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [projects, setProjects] = useState<budget.Project[]>([]);
  const [friends, setFriends] = useState<friendship.FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
    back: isTr ? "Katalog" : "Catalog"
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
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 font-sans selection:bg-blue-100">
      <Toaster position="top-center" />

      {/* Subtle Premium Background Blur (Light) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-1/4 -left-1/4 w-[80%] h-[80%] rounded-full blur-[120px] opacity-20 bg-blue-200" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[70%] h-[70%] rounded-full blur-[100px] opacity-20 bg-pink-100" />
      </div>

      <main className="flex-1 px-4 py-8 pb-36 max-w-md mx-auto w-full flex flex-col relative z-10">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => window.location.href = getAppRootUrl()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-gray-500 hover:text-gray-900 border border-gray-200/60 transition-all active:scale-90 shadow-sm"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
        </div>

        {/* Budget Title Logo (Light) */}
        <div className="flex items-baseline justify-center gap-2 mb-10 select-none">
          <span className="text-4xl font-extrabold tracking-tight text-gray-900 font-mono lowercase">{t.title}</span>
        </div>

        {/* Projects List */}
        <div className="flex-1 space-y-4">
          {loading ? (
             <div className="py-20 text-center text-gray-400 text-sm font-medium animate-pulse">
               {t.loadingText}
             </div>
          ) : projects.length === 0 ? (
            <div className="py-24 text-center bg-white rounded-3xl border border-gray-200/50 p-6 flex flex-col items-center justify-center shadow-sm">
              <span className="text-4xl mb-4">🏖️</span>
              <p className="text-gray-400 text-sm font-semibold">{t.emptyState}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => {
                const dateRange = getProjectRangeLabel(project.start_date, project.end_date);
                return (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/apps/budget/${project.id}`)}
                    className="bg-white hover:bg-gray-50 border border-gray-200/50 rounded-[1.6rem] p-4 flex justify-between items-center transition-all cursor-pointer active:scale-[0.98] group shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      {/* Beach umbrella icon wrapper */}
                      <div className="w-14 h-14 rounded-2xl bg-[#FAF9F7] border border-gray-100 flex items-center justify-center text-3xl shadow-inner select-none">
                        🏖️
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-gray-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                          {project.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users size={13} />
                            {project.member_count || 1} {t.members}
                          </span>
                          {dateRange && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-gray-300" />
                              <span>{dateRange}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Total spent badge */}
                      {project.total_spent !== undefined && Number(project.total_spent) > 0 && (
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-gray-900">
                            {getCurrencySymbol(project.currency)}{formatVal(Number(project.total_spent))}
                          </span>
                        </div>
                      )}
                      <div className="text-gray-400 group-hover:text-gray-900 transition-colors pr-1">
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
            <button className="pointer-events-auto bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-[0_10px_25px_rgba(37,99,235,0.25)] flex items-center justify-center active:scale-[0.9] transition-all hover:scale-105">
              <Plus size={28} weight="bold" />
            </button>
          </Drawer.Trigger>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 select-none pointer-events-none">{t.newBudget}</span>
          
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
            <Drawer.Content className="bg-white text-gray-900 flex flex-col rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[70] max-w-md mx-auto border-t border-gray-200">
              <div className="p-6 overflow-y-auto">
                <div className="mx-auto w-12 h-1 rounded-full bg-gray-200 mb-6" />
                <Drawer.Title className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-blue-500">🏖️</span> {isTr ? "Yeni Bütçe" : "New Budget"}
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
    endDate: ""
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
        endDate: formData.endDate || undefined
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
    <form onSubmit={handleSubmit} className="space-y-4 pb-8 text-sm text-gray-800">
      {/* Title */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
          {t.titleInput}
        </label>
        <input 
          required 
          placeholder={t.titlePlaceholder} 
          value={formData.name} 
          onChange={e => setFormData({...formData, name: e.target.value})} 
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold" 
        />
      </div>

      {/* Currency & Type */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
            {t.currency}
          </label>
          <select 
            value={formData.currency} 
            onChange={e => setFormData({...formData, currency: e.target.value})} 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
          >
            <option value="TRY">Türk Lirası (₺)</option>
            <option value="USD">Dolar ($)</option>
            <option value="EUR">Euro (€)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
            {t.groupType}
          </label>
          <select 
            value={formData.groupType} 
            onChange={e => setFormData({...formData, groupType: e.target.value})} 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
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
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
            {isTr ? "Başlangıç Tarihi (Opsiyonel)" : "Start Date (Optional)"}
          </label>
          <input 
            type="date" 
            value={formData.startDate} 
            onChange={e => setFormData({...formData, startDate: e.target.value})} 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-xs cursor-pointer" 
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
            {isTr ? "Bitiş Tarihi (Opsiyonel)" : "End Date (Optional)"}
          </label>
          <input 
            type="date" 
            value={formData.endDate} 
            onChange={e => setFormData({...formData, endDate: e.target.value})} 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-xs cursor-pointer" 
          />
        </div>
      </div>

      {/* Members List Box (like Tricount layout) */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
          {t.membersInput}
        </label>
        <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-gray-50">
          {membersList.map((name) => (
            <div key={name} className="flex justify-between items-center p-3 bg-white">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                {user && name === (dbUsername || "Ben") ? (
                  <>
                    <img 
                      src={user.imageUrl} 
                      alt={name} 
                      className="w-5 h-5 rounded-full object-cover border border-gray-200" 
                    />
                    <span>{name} (Ben)</span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-400 text-[9px]">
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <span>{name}</span>
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveMember(name)}
                className="text-gray-400 hover:text-red-500 p-1 active:scale-95 transition-all"
              >
                <Trash size={15} />
              </button>
            </div>
          ))}

          {/* Quick guest add row */}
          <div className="flex bg-gray-50 p-2 gap-2">
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
              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-950 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddGuestMember}
              className="bg-blue-50 border border-blue-200 text-blue-600 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-1"
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
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
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
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${isSelected ? "bg-blue-50 border-blue-500 text-blue-600 shadow-sm" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100"}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                  </div>
                  {friend.avatar ? (
                    <img src={friend.avatar} alt={name} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-400">
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
        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold shadow-md h-12 flex items-center justify-center gap-2 active:scale-95 transition-all mt-4"
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
