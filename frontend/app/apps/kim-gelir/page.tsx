"use client";

import { useEffect, useState, Suspense } from "react";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  MapPin, 
  Clock, 
  Check, 
  Question, 
  X, 
  Users, 
  Spinner,
  Calendar,
  Sparkle,
  TrendUp,
  ListBullets,
  CalendarBlank,
  PlusCircle,
  Trash
} from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import { friendship, kim_gelir, workplaces } from "@/lib/client";
import { Drawer } from "vaul";
import dynamic from "next/dynamic";

const StudyPlacesMap = dynamic(() => import("../_workplaces/StudyPlacesMap"), {
  ssr: false,
});

const client = createBrowserClient();

// Fast Activity Presets
import ACTIVITIES_DATA from "./activities.json";
import CINEMAS_DATA from "./cinemas.json";
import THEATERS_DATA from "./theaters.json";
import { GAMES_DATA } from "../iskambil/games-registry";
const ALL_PRESET_ACTIVITIES = ACTIVITIES_DATA.flatMap(cat => cat.items);

const PRESET_TIMES = [
  { id: "now", label: "Şimdi" },
  { id: "30mins", label: "30 dk sonra" },
  { id: "evening", label: "Bugün akşam" },
  { id: "tomorrow", label: "Yarın" },
  { id: "custom", label: "Özel Saat" },
];

type ActivityType = "quick_invite" | "plan_poll" | "time_poll";

function KimGelirContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // State lists
  const [activities, setActivities] = useState<kim_gelir.Activity[]>([]);
  const [friends, setFriends] = useState<friendship.FriendUser[]>([]);
  const [workplacesList, setWorkplacesList] = useState<workplaces.Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Creator Modal state
  const [showModal, setShowModal] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("quick_invite");
  
  // Quick Invite fields
  const [customTitle, setCustomTitle] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedTimeId, setSelectedTimeId] = useState("now");
  const [customTime, setCustomTime] = useState("");
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetSearch, setPresetSearch] = useState("");
  const [tempSelectedActivity, setTempSelectedActivity] = useState<{ id: string; label: string; icon: string } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  // Common / Poll fields
  const [location, setLocation] = useState("");
  const [pollTitle, setPollTitle] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Details Drawer states
  const [selectedDetailActivity, setSelectedDetailActivity] = useState<kim_gelir.Activity | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editTimeOption, setEditTimeOption] = useState("");
  const [editCustomTime, setEditCustomTime] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);

  const handleOpenDetails = (act: kim_gelir.Activity) => {
    setSelectedDetailActivity(act);
    setIsEditMode(false);
    setEditTitle(act.title);
    setEditLocation(act.location);
    setEditTimeOption(act.timeOption);
    setEditCustomTime(act.customTime || "");
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!user) return;
    if (!confirm("Bu aktiviteyi silmek istediğinize emin misiniz?")) return;
    try {
      setDetailLoading(true);
      await client.kim_gelir.deleteActivity({
        activityId,
        userId: user.id
      });
      showToastMsg("Aktivite başarıyla silindi.", "success");
      setSelectedDetailActivity(null);
      fetchAllData();
    } catch (err) {
      console.error(err);
      showToastMsg("Aktivite silinemedi.", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEditActivity = async (activityId: string) => {
    if (!user) return;
    if (!editTitle.trim() || !editLocation.trim()) {
      showToastMsg("Lütfen tüm alanları doldurun.", "error");
      return;
    }
    try {
      setDetailLoading(true);
      await client.kim_gelir.editActivity({
        activityId,
        userId: user.id,
        title: editTitle.trim(),
        location: editLocation.trim(),
        timeOption: editTimeOption,
        customTime: editCustomTime.trim() || undefined
      });
      showToastMsg("Aktivite başarıyla güncellendi.", "success");
      setIsEditMode(false);
      
      // Update local state directly for responsive interface
      setActivities(prev =>
        prev.map(act =>
          act.id === activityId
            ? { ...act, title: editTitle.trim(), location: editLocation.trim(), timeOption: editTimeOption, customTime: editCustomTime.trim() || null }
            : act
        )
      );
      
      // Also update selectedDetailActivity
      setSelectedDetailActivity(prev => 
        prev ? { ...prev, title: editTitle.trim(), location: editLocation.trim(), timeOption: editTimeOption, customTime: editCustomTime.trim() || null } : null
      );
    } catch (err) {
      console.error(err);
      showToastMsg("Aktivite güncellenemedi.", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchAllData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const actsRes = await client.kim_gelir.getActivities(user.id);
      setActivities(actsRes.activities);

      const friendsRes = await client.friendship.getFriends(user.id);
      setFriends(friendsRes.friends);

      try {
        const workplacesRes = await client.workplaces.listPlaces({ userId: user.id });
        setWorkplacesList(workplacesRes.places || []);
      } catch (wErr) {
        console.error("Error fetching workplaces:", wErr);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      showToastMsg("Veriler yüklenirken bir hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchAllData();
    }
  }, [isLoaded, user]);

  const showToastMsg = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, ""]);
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length <= 2) return;
    setPollOptions(pollOptions.filter((_, i) => i !== idx));
  };

  const handlePollOptionChange = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let finalTitle = "";
    let finalOptions: string[] = [];
    let finalTimeOption = "Şimdi";
    let finalCustomTime: string | undefined = undefined;

    if (activityType === "quick_invite") {
      if (selectedPresetId === null) {
        showToastMsg("Lütfen bir aktivite seçin.", "error");
        return;
      }
      finalTitle = ALL_PRESET_ACTIVITIES.find(p => p.id === selectedPresetId)?.label || "Aktivite";
      if (selectedPresetId === "" && customTitle.trim()) {
        finalTitle = customTitle;
      } else if (selectedPresetId === "" && !customTitle.trim()) {
        showToastMsg("Lütfen bir aktivite seçin veya yazın.", "error");
        return;
      }
      finalTimeOption = PRESET_TIMES.find(t => t.id === selectedTimeId)?.label || "Şimdi";
      if (selectedTimeId === "custom" && !customTime.trim()) {
        showToastMsg("Lütfen özel saat girin.", "error");
        return;
      }
      finalCustomTime = selectedTimeId === "custom" ? customTime.trim() : undefined;
    } else {
      // Plan Poll
      if (!pollTitle.trim()) {
        showToastMsg("Lütfen bir başlık girin.", "error");
        return;
      }
      finalTitle = pollTitle.trim();
      finalOptions = [];
      finalTimeOption = "Seçenekli Plan";
    }

    if (activityType !== "plan_poll" && !location.trim()) {
      showToastMsg("Lütfen bir konum girin.", "error");
      return;
    }

    if (selectedFriendIds.length === 0) {
      showToastMsg("Lütfen en az bir arkadaş seçin.", "error");
      return;
    }

    try {
      setModalLoading(true);
      await client.kim_gelir.createActivity({
        creatorId: user.id,
        title: finalTitle,
        location: location.trim(),
        timeOption: finalTimeOption,
        customTime: finalCustomTime,
        invitedUserIds: selectedFriendIds,
        activityType: activityType,
        options: finalOptions,
      });

      showToastMsg("Aktivite başarıyla oluşturuldu!", "success");
      setShowModal(false);
      
      // Reset state
      setCustomTitle("");
      setSelectedPresetId(null);
      setSelectedTimeId("now");
      setCustomTime("");
      setLocation("");
      setPollTitle("");
      setPollOptions(["", ""]);
      setSelectedFriendIds([]);

      // Refresh list
      const actsRes = await client.kim_gelir.getActivities(user.id);
      setActivities(actsRes.activities);
    } catch (err) {
      console.error(err);
      showToastMsg("Aktivite oluşturulamadı.", "error");
    } finally {
      setModalLoading(false);
    }
  };

  const handleRespond = async (activityId: string, status: string, selectedOptions: string[]) => {
    if (!user) return;
    try {
      setActionLoading(`${activityId}`);
      await client.kim_gelir.respondToActivity({
        activityId,
        userId: user.id,
        status,
        selectedOptions,
      });

      // Update local state directly for responsive interface
      setActivities(prev => 
        prev.map(act => {
          if (act.id !== activityId) return act;
          const updatedResponses = act.responses.map(resp => {
            if (resp.userId === user.id) {
              return { ...resp, status: status as any, selectedOptions, updatedAt: new Date().toISOString() };
            }
            return resp;
          });
          
          if (!updatedResponses.some(r => r.userId === user.id)) {
            updatedResponses.push({
              userId: user.id,
              username: user.username || user.fullName || "Ben",
              avatar: user.imageUrl || null,
              status: status as any,
              selectedOptions,
              updatedAt: new Date().toISOString()
            });
          }
          return { ...act, responses: updatedResponses };
        })
      );

      showToastMsg("Cevabınız iletildi!", "success");
    } catch (err) {
      console.error(err);
      showToastMsg("Cevap iletilemedi.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddOptionToPoll = async (activityId: string, optionText: string) => {
    if (!user) return;
    try {
      setActionLoading(`add-option-${activityId}`);
      await client.kim_gelir.addActivityOption({
        activityId,
        option: optionText.trim(),
      });
      // Refresh data
      const actsRes = await client.kim_gelir.getActivities(user.id);
      setActivities(actsRes.activities);
      showToastMsg("Seçenek eklendi!", "success");
    } catch (err) {
      console.error(err);
      showToastMsg("Seçenek eklenemedi.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId) 
        : [...prev, friendId]
    );
  };

  const selectAllFriends = () => {
    if (selectedFriendIds.length === friends.length) {
      setSelectedFriendIds([]);
    } else {
      setSelectedFriendIds(friends.map(f => f.id));
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <main className="flex-1 flex items-center justify-center">
          <Spinner size={32} className="text-[#FF6B6B] animate-spin" />
        </main>
      </div>
    );
  }

  const myActivities = activities.filter(a => a.creatorId === user.id);
  const invitedActivities = activities.filter(a => a.creatorId !== user.id);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 pb-20">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-100/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-amber-100/20 blur-[120px] rounded-full"></div>
      </div>

      <main className="flex-1 px-4 max-w-md mx-auto w-full pt-6">
        {/* Navigation & Header */}
        <header className="flex items-center justify-between h-20 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/home")} 
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200/60 rounded-xl shadow-sm hover:bg-gray-50 transition-all active:scale-95"
            >
              <ArrowLeft size={20} weight="bold" className="text-gray-500" />
            </button>
            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">
              Ne Yapsak?
            </h1>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-5 py-3 bg-[#FF6B6B] hover:bg-[#ff5252] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-900/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            <span>Aktivite Aç</span>
          </button>
        </header>

        {/* Content sections */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={32} className="text-[#FF6B6B] animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 bg-rose-50 text-[#FF6B6B] rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
              <Users size={36} weight="duotone" />
            </div>
            <h2 className="font-extrabold text-lg text-gray-800 mb-2">Henüz Aktif Plan Yok</h2>
            <p className="text-gray-400 text-xs leading-relaxed max-w-[280px] mb-8">
              Spora mı gidiyorsun, kahve mi içeceksin veya plan anketi mi yapacaksın? Hemen bir plan açıp arkadaşlarına haber ver!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="py-3.5 px-6 bg-white hover:bg-gray-50 border border-gray-150 shadow-sm text-gray-700 rounded-2xl font-bold text-sm transition-all active:scale-95 cursor-pointer"
            >
              İlk Aktiviteni Oluştur
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Gelen Davetler */}
            {invitedActivities.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <TrendUp size={16} className="text-rose-500" weight="bold" />
                  <h2 className="font-black text-gray-900 text-sm uppercase tracking-wider">Gelen Davetler</h2>
                  <span className="bg-rose-50 text-[#FF6B6B] text-[10px] font-black px-2 py-0.5 rounded-full">
                    {invitedActivities.length}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {invitedActivities.map(act => (
                    <ActivityCard 
                      key={act.id} 
                      activity={act} 
                      currentUserId={user.id} 
                      onRespond={handleRespond}
                      onAddOption={handleAddOptionToPoll}
                      actionLoading={actionLoading}
                      onOpenDetails={handleOpenDetails}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Benim Davetlerim */}
            {myActivities.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Sparkle size={16} className="text-amber-500" weight="bold" />
                  <h2 className="font-black text-gray-900 text-sm uppercase tracking-wider">Benim Davetlerim</h2>
                  <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {myActivities.length}
                  </span>
                </div>

                <div className="space-y-4">
                  {myActivities.map(act => (
                    <ActivityCard 
                      key={act.id} 
                      activity={act} 
                      currentUserId={user.id} 
                      onRespond={handleRespond}
                      onAddOption={handleAddOptionToPoll}
                      actionLoading={actionLoading}
                      onOpenDetails={handleOpenDetails}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* CREATE DRAWER */}
      <Drawer.Root open={showModal} onOpenChange={setShowModal}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[92dvh] outline-none z-[70] max-w-md mx-auto border-t border-gray-100 shadow-2xl flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto flex flex-col">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-200 mb-4" />

              <header className="flex justify-between items-center mb-4 shrink-0">
                <Drawer.Title className="font-black text-xl text-gray-900">Aktivite Oluştur</Drawer.Title>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                >
                  <X size={20} weight="bold" />
                </button>
              </header>

              {/* Sub-type tabs */}
              <div className="flex gap-1.5 p-1 bg-gray-100 rounded-2xl mb-5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActivityType("quick_invite")}
                  className={`flex-1 py-2 text-center rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                    activityType === "quick_invite" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Check size={14} className="inline mr-1" weight="bold" />
                  Davet Et
                </button>
                <button
                  type="button"
                  onClick={() => setActivityType("plan_poll")}
                  className={`flex-1 py-2 text-center rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                    activityType === "plan_poll" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <ListBullets size={14} className="inline mr-1" weight="bold" />
                  Planla
                </button>
              </div>

              <form onSubmit={handleCreateActivity} className="flex-1 overflow-y-auto space-y-6 pr-1">
                
                {/* Conditional Inputs Based on Type */}
                {activityType === "quick_invite" ? (
                  <>
                    {/* Quick: Ne Yapıyorsun? */}
                    <div className="space-y-3">
                      <label className="font-extrabold text-xs text-gray-400 uppercase tracking-wider block">1. Ne Yapıyorsun?</label>
                      
                      {/* Activity Selector Button */}
                      <button
                        type="button"
                        onClick={() => setShowPresetModal(true)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-150 rounded-2xl text-left hover:bg-gray-100 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {selectedPresetId !== null
                              ? selectedPresetId 
                                ? ALL_PRESET_ACTIVITIES.find(p => p.id === selectedPresetId)?.icon || "❓"
                                : "✍️"
                              : "🔍"}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-800">
                              {selectedPresetId !== null
                                ? selectedPresetId 
                                  ? ALL_PRESET_ACTIVITIES.find(p => p.id === selectedPresetId)?.label || "Aktivite Seçin..."
                                  : customTitle || "Özel Aktivite"
                                : "Aktivite Seçin..."}
                            </span>
                            {location.trim() && (
                              <span className="text-xs text-gray-400 font-semibold mt-0.5">
                                {location}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-black text-[#FF6B6B] uppercase tracking-wider">
                          {selectedPresetId !== null ? "Değiştir" : "Seç"}
                        </span>
                      </button>
                    </div>

                    {/* Quick: Ne Zaman? */}
                    <div className="space-y-3">
                      <label className="font-extrabold text-xs text-gray-400 uppercase tracking-wider block">2. Ne Zaman?</label>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_TIMES.map(time => (
                          <button
                            key={time.id}
                            type="button"
                            onClick={() => setSelectedTimeId(time.id)}
                            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              selectedTimeId === time.id
                                ? "bg-gray-900 border-gray-900 text-white"
                                : "bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-600"
                            }`}
                          >
                            {time.label}
                          </button>
                        ))}
                      </div>

                      {selectedTimeId === "custom" && (
                        <input
                          type="text"
                          value={customTime}
                          onChange={(e) => setCustomTime(e.target.value)}
                          placeholder="Örn: Bugün 19:30, Cumartesi 14:00"
                          className="w-full bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#FF6B6B] transition-colors mt-2"
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Poll Title */}
                    <div className="space-y-3">
                      <label className="font-extrabold text-xs text-gray-400 uppercase tracking-wider block">
                        Plan Başlığı
                      </label>
                      <input
                        type="text"
                        value={pollTitle}
                        onChange={(e) => setPollTitle(e.target.value)}
                        placeholder="Örn: Akşam ne yapalım? / Halı saha ne zaman?"
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#FF6B6B] transition-colors font-bold"
                      />
                    </div>
                  </>
                )}

                {/* Kimlere Sorulsun? */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-xs text-gray-400 uppercase tracking-wider block">
                      {activityType === "quick_invite" ? "3. Kimlere Sorulsun?" : "Kimlere Sorulsun?"}
                    </label>
                    {friends.length > 0 && (
                      <button
                        type="button"
                        onClick={selectAllFriends}
                        className="text-[10px] font-black text-[#FF6B6B] uppercase hover:underline"
                      >
                        {selectedFriendIds.length === friends.length ? "Temizle" : "Hepsini Seç"}
                      </button>
                    )}
                  </div>

                  {friends.length === 0 ? (
                    <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl text-center text-xs text-gray-400 font-medium leading-relaxed">
                      Henüz arkadaş listen boş! Önce arkadaşlar sayfasından birilerini eklemelisin.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      {friends.map(friend => {
                        const isSelected = selectedFriendIds.includes(friend.id);
                        return (
                          <button
                            key={friend.id}
                            type="button"
                            onClick={() => toggleFriendSelection(friend.id)}
                            className={`flex items-center gap-2.5 p-2 rounded-2xl border text-left transition-all text-xs font-bold cursor-pointer ${
                              isSelected
                                ? "bg-rose-50 border-[#FF6B6B] text-rose-700"
                                : "bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-700"
                            }`}
                          >
                            <div className="w-7 h-7 rounded-xl bg-gray-200 overflow-hidden flex items-center justify-center shrink-0 text-sm">
                              {friend.avatar ? (
                                <img src={friend.avatar} alt="Avatar" className="w-full h-full object-cover" />
                              ) : "👤"}
                            </div>
                            <span className="truncate flex-1 pr-1">{friend.username || "Anonim"}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-4 shrink-0">
                  <button
                    type="submit"
                    disabled={
                      modalLoading || 
                      selectedFriendIds.length === 0 ||
                      (activityType === "quick_invite" && selectedPresetId === null) ||
                      (activityType === "plan_poll" && !pollTitle.trim())
                    }
                    className="w-full py-4 bg-[#FF6B6B] hover:bg-[#ff5252] disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md shadow-red-100"
                  >
                    {modalLoading ? (
                      <Spinner size={18} className="animate-spin" />
                    ) : (
                      "Aktivite Davetini Gönder"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* PRESET ACTIVITIES DRAWER */}
      <Drawer.Root open={showPresetModal} onOpenChange={(open) => {
        setShowPresetModal(open);
        if (!open) {
          setPresetSearch("");
          setTempSelectedActivity(null);
        }
      }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]" />
          <Drawer.Content className="bg-white rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-[90] max-w-md mx-auto border-t border-gray-100 shadow-2xl flex flex-col">
            {!tempSelectedActivity ? (
              <div className="p-6 flex-1 overflow-y-auto flex flex-col">
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-200 mb-4" />

                <header className="flex justify-between items-center mb-4 shrink-0">
                  <div>
                    <Drawer.Title className="font-black text-xl text-gray-900">Aktivite Seç</Drawer.Title>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Yapacağın aktiviteyi listeden seçebilirsin</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowPresetModal(false);
                      setPresetSearch("");
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </header>

                {/* Search Input */}
                <div className="relative mb-3 shrink-0">
                  <input
                    type="text"
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    placeholder="Aktivite ara... (örn: Halı Saha, Kahve)"
                    className="w-full bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#FF6B6B] transition-colors"
                  />
                  {presetSearch && (
                    <button
                      onClick={() => setPresetSearch("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                    >
                      Temizle
                    </button>
                  )}
                </div>

                {/* Custom Activity Option based on search query */}
                {presetSearch.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempSelectedActivity({ id: "", label: presetSearch.trim(), icon: "✍️" });
                      setLocation("");
                    }}
                    className="mb-4 w-full flex items-center justify-between p-3.5 bg-rose-50 border border-rose-100 hover:bg-rose-100/55 rounded-2xl text-left transition-all cursor-pointer text-xs font-bold text-rose-700 shrink-0 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2">
                      <span>✍️</span>
                      <span>Özel aktivite: &quot;{presetSearch}&quot;</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6B6B]">Detay Gir</span>
                  </button>
                )}

                {/* Grouped Preset List */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-4">
                  {(() => {
                    const filteredData = ACTIVITIES_DATA.map(cat => {
                      const items = cat.items.filter(item => 
                        item.label.toLowerCase().includes(presetSearch.toLowerCase())
                      );
                      return { ...cat, items };
                    }).filter(cat => cat.items.length > 0);

                    if (filteredData.length === 0) {
                      return (
                        <div className="py-12 text-center">
                          <p className="text-sm font-bold text-gray-400">Aradığın aktivite bulunamadı.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setTempSelectedActivity({ id: "", label: presetSearch.trim(), icon: "✍️" });
                              setLocation("");
                            }}
                            className="mt-3 text-xs font-black text-[#FF6B6B] hover:underline"
                          >
                            &quot;{presetSearch}&quot; olarak özel aktivite oluştur
                          </button>
                        </div>
                      );
                    }

                    return filteredData.map(cat => {
                      const isSearching = presetSearch.trim() !== "";
                      const isExpanded = expandedCategories[cat.category] || false;
                      const visibleItems = (isExpanded || isSearching) ? cat.items : cat.items.slice(0, 4);

                      return (
                        <div key={cat.category} className="space-y-2.5">
                          <h4 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider px-1">
                            {cat.category}
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {visibleItems.map(item => {
                              const isSelected = selectedPresetId === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setTempSelectedActivity({ id: item.id, label: item.label, icon: item.icon });
                                    setLocation("");
                                  }}
                                  className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all text-xs font-bold cursor-pointer active:scale-95 ${
                                    isSelected
                                      ? "bg-rose-50 border-[#FF6B6B] text-rose-700"
                                      : "bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  <span className="text-lg shrink-0">{item.icon}</span>
                                  <span className="truncate flex-1">{item.label}</span>
                                </button>
                              );
                            })}
                          </div>

                          {cat.items.length > 4 && !isSearching && (
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedCategories(prev => ({
                                  ...prev,
                                  [cat.category]: !isExpanded
                                }));
                              }}
                              className="w-full text-center py-2 text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-gray-700 transition-colors cursor-pointer mt-1.5 active:scale-95 hover:underline"
                            >
                              {isExpanded ? "Daha Az Göster" : `Daha Fazla Göster (+${cat.items.length - 4})`}
                            </button>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            ) : (
              <div className="p-6 flex-1 overflow-y-auto flex flex-col">
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-200 mb-4" />

                <header className="flex justify-between items-center mb-6 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTempSelectedActivity(null)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors active:scale-95 cursor-pointer"
                    >
                      <ArrowLeft size={20} weight="bold" />
                    </button>
                    <Drawer.Title className="font-black text-xl text-gray-900">Aktivite Detayı</Drawer.Title>
                  </div>
                  <button 
                    onClick={() => {
                      setShowPresetModal(false);
                      setPresetSearch("");
                      setTempSelectedActivity(null);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </header>

                <div className="flex items-center gap-3.5 p-4 bg-gray-50 border border-gray-150 rounded-2xl mb-6 shrink-0">
                  <span className="text-2xl">{tempSelectedActivity.icon}</span>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Seçilen Aktivite</span>
                    <span className="text-sm font-bold text-gray-800">{tempSelectedActivity.label}</span>
                  </div>
                </div>

                {/* Dynamic location form question */}
                {(() => {
                  let locationLabel = "Buluşma yeri neresi?";
                  let locationPlaceholder = "Örn: Kadıköy, Kampüs, Cafe adı...";
                  const actId = tempSelectedActivity.id;

                  const isStudyActivity = [
                    "study",
                    "exam_study",
                    "project",
                    "library",
                    "coworking",
                    "homework",
                    "presentation",
                    "brainstorm",
                    "reading",
                    "language_practice"
                  ].includes(actId);

                  if (actId === "gym") {
                    locationLabel = "Hangi spor salonunda buluşacaksınız?";
                    locationPlaceholder = "Örn: MacFit Kadıköy, Hillside...";
                  } else if (actId === "coffee" || actId === "tea") {
                    locationLabel = "Hangi kafede buluşacaksınız?";
                    locationPlaceholder = "Örn: Starbucks, Espressolab, Kahve Dünyası...";
                  } else if (["food", "breakfast", "brunch", "lunch", "dinner", "dessert", "pizza", "burger", "sushi"].includes(actId)) {
                    locationLabel = "Hangi restoranda / nerede yemek yiyeceksiniz?";
                    locationPlaceholder = "Örn: Nusr-Et, Kadıköy Midyecisi, evde...";
                  } else if (actId === "movie") {
                    locationLabel = "Hangi sinemada buluşacaksınız?";
                    locationPlaceholder = "Örn: Paribu Cineverse Akasya...";
                  } else if (actId === "theater") {
                    locationLabel = "Hangi tiyatroda buluşacaksınız?";
                    locationPlaceholder = "Örn: Harbiye Muhsin Ertuğrul Sahnesi...";
                  } else if (actId === "card_game") {
                    locationLabel = "Hangi kart oyununu oynayacaksınız?";
                    locationPlaceholder = "Örn: Batak, Pis Yedili, Pişti...";
                  } else if (["football", "basketball", "volleyball", "tennis", "table_tennis"].includes(actId)) {
                    locationLabel = "Hangi sahada / kortta oynayacaksınız?";
                    locationPlaceholder = "Örn: İTÜ Halı Sahası, Bostancı Spor Tesisleri...";
                  } else if (actId === "library") {
                    locationLabel = "Hangi kütüphanede çalışacaksınız?";
                    locationPlaceholder = "Örn: İTÜ Mustafa İnan Kütüphanesi, Salt Galata...";
                  } else if (isStudyActivity) {
                    locationLabel = "Nerede çalışacaksınız?";
                    locationPlaceholder = "Örn: İTÜ Kütüphanesi, Espressolab, Ev...";
                  }

                  const getNormalized = (text: string) => {
                    return text
                      .toLowerCase()
                      .replace(/ı/g, 'i')
                      .replace(/ğ/g, 'g')
                      .replace(/ü/g, 'u')
                      .replace(/ş/g, 's')
                      .replace(/ö/g, 'o')
                      .replace(/ç/g, 'c');
                  };

                  const query = getNormalized(location);
                  const filteredCinemas = actId === "movie" 
                    ? (CINEMAS_DATA as any[]).filter(c => {
                        if (!location.trim()) return true;
                        const nameMatch = getNormalized(c.name || "").includes(query);
                        const districtMatch = getNormalized(c.district || "").includes(query);
                        const keywordsMatch = c.keywords?.some((k: string) => getNormalized(k || "").includes(query));
                        return nameMatch || districtMatch || keywordsMatch;
                      })
                    : [];

                  const filteredTheaters = actId === "theater" 
                    ? (THEATERS_DATA as any[]).filter(t => {
                        if (!location.trim()) return true;
                        const nameMatch = getNormalized(t.name || "").includes(query);
                        const districtMatch = getNormalized(t.district || "").includes(query);
                        const keywordsMatch = t.keywords?.some((k: string) => getNormalized(k || "").includes(query));
                        return nameMatch || districtMatch || keywordsMatch;
                      })
                    : [];

                  const filteredGames = actId === "card_game"
                    ? (GAMES_DATA as any[]).filter(g => {
                        if (!location.trim()) return true;
                        const nameTrMatch = getNormalized(g.name_tr || "").includes(query);
                        const nameEnMatch = getNormalized(g.name_en || "").includes(query);
                        return nameTrMatch || nameEnMatch;
                      })
                    : [];

                  const filteredWorkplaces = isStudyActivity
                    ? (workplacesList || []).filter(w => {
                        if (!location.trim()) return true;
                        const nameMatch = getNormalized(w.name || "").includes(query);
                        const districtMatch = getNormalized(w.district || "").includes(query);
                        const tagsMatch = w.tags?.some((t: string) => getNormalized(t || "").includes(query));
                        return nameMatch || districtMatch || tagsMatch;
                      })
                    : [];

                  return (
                    <div className="space-y-3 mb-4 flex flex-col min-h-0">
                      <label className="font-extrabold text-xs text-gray-400 uppercase tracking-wider block shrink-0">
                        {locationLabel}
                      </label>
                      <div className="relative shrink-0">
                        <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder={locationPlaceholder}
                          className="w-full bg-gray-50 border border-gray-150 rounded-2xl pl-11 pr-10 py-3 text-xs focus:outline-none focus:border-[#FF6B6B] transition-colors font-bold text-gray-800"
                          autoFocus
                        />
                        {location && (
                          <button
                            type="button"
                            onClick={() => setLocation("")}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-650 hover:bg-gray-250/50 rounded-full transition-all active:scale-90"
                          >
                            <X size={14} weight="bold" />
                          </button>
                        )}
                      </div>

                      {actId === "movie" && (
                        <div className="mt-2 space-y-1.5 overflow-y-auto max-h-60 pr-1 flex-1">
                          {filteredCinemas.map((cinema) => {
                            const cinemaValue = `${cinema.name} (${cinema.district})`;
                            const isSelected = location === cinemaValue;
                            return (
                              <button
                                key={cinema.id}
                                type="button"
                                onClick={() => setLocation(cinemaValue)}
                                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-rose-50 border-[#FF6B6B] text-rose-700"
                                    : "bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-700"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-sm shrink-0">🎬</span>
                                  <span className="truncate">{cinema.name}</span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold shrink-0 ml-2 ${
                                  isSelected ? "bg-rose-100 text-rose-800" : "bg-gray-200/60 text-gray-500"
                                }`}>
                                  {cinema.district}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {actId === "theater" && (
                        <div className="mt-2 space-y-1.5 overflow-y-auto max-h-60 pr-1 flex-1">
                          {filteredTheaters.map((theater) => {
                            const theaterValue = `${theater.name} (${theater.district})`;
                            const isSelected = location === theaterValue;
                            return (
                              <button
                                key={theater.id}
                                type="button"
                                onClick={() => setLocation(theaterValue)}
                                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-rose-50 border-[#FF6B6B] text-rose-700"
                                    : "bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-700"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-sm shrink-0">🎭</span>
                                  <span className="truncate">{theater.name}</span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold shrink-0 ml-2 ${
                                  isSelected ? "bg-rose-100 text-rose-800" : "bg-gray-200/60 text-gray-500"
                                }`}>
                                  {theater.district}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {actId === "card_game" && (
                        <div className="mt-2 space-y-1.5 overflow-y-auto max-h-60 pr-1 flex-1">
                          {filteredGames.map((game) => {
                            const gameValue = game.name_tr;
                            const isSelected = location === gameValue;
                            return (
                              <button
                                key={game.id}
                                type="button"
                                onClick={() => setLocation(gameValue)}
                                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-rose-50 border-[#FF6B6B] text-rose-700"
                                    : "bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-700"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-sm shrink-0">🃏</span>
                                  <span className="truncate">{game.name_tr}</span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold shrink-0 ml-2 ${
                                  isSelected ? "bg-rose-100 text-rose-800" : "bg-gray-200/60 text-gray-500"
                                }`}>
                                  {game.minPlayers}-{game.maxPlayers} Oyuncu
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {isStudyActivity && (
                        <div className="flex flex-col gap-2 min-h-0 flex-1">
                          {/* Map view wrapper */}
                          {filteredWorkplaces.some(w => w.latitude && w.longitude) && (
                            <div className="w-full h-40 rounded-2xl overflow-hidden border border-gray-150 shrink-0 z-10">
                              <StudyPlacesMap
                                places={filteredWorkplaces}
                                onSelectPlace={(place) => setLocation(`${place.name} (${place.district || "İstanbul"})`)}
                                selectedPlaceId={workplacesList.find(w => `${w.name} (${w.district || "İstanbul"})` === location)?.id}
                              />
                            </div>
                          )}

                          {/* List view of matches */}
                          <div className="space-y-1.5 overflow-y-auto max-h-48 pr-1 flex-1 mt-1">
                            {filteredWorkplaces.map((place) => {
                              const placeValue = `${place.name} (${place.district || "İstanbul"})`;
                              const isSelected = location === placeValue;
                              return (
                                <button
                                  key={place.id}
                                  type="button"
                                  onClick={() => setLocation(placeValue)}
                                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-rose-50 border-[#FF6B6B] text-rose-700"
                                      : "bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="text-sm shrink-0">🏫</span>
                                    <span className="truncate">{place.name}</span>
                                  </div>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold shrink-0 ml-2 ${
                                    isSelected ? "bg-rose-100 text-rose-800" : "bg-gray-200/60 text-gray-500"
                                  }`}>
                                    {place.district || "Çalışma Alanı"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="pt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (tempSelectedActivity.id) {
                        setSelectedPresetId(tempSelectedActivity.id);
                        setCustomTitle("");
                      } else {
                        setSelectedPresetId("");
                        setCustomTitle(tempSelectedActivity.label);
                      }
                      setShowPresetModal(false);
                      setPresetSearch("");
                      setTempSelectedActivity(null);
                    }}
                    disabled={!location.trim()}
                    className="w-full py-4 bg-[#FF6B6B] hover:bg-[#ff5252] disabled:opacity-50 text-white rounded-2xl font-bold text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md shadow-red-100"
                  >
                    Tamam, Aktiviteyi Seç
                  </button>
                </div>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* DETAILS DRAWER */}
      <Drawer.Root open={!!selectedDetailActivity} onOpenChange={(open) => { if (!open) setSelectedDetailActivity(null); }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[92dvh] outline-none z-[70] max-w-md mx-auto border-t border-gray-100 shadow-2xl flex flex-col">
            {selectedDetailActivity && (
              <div className="p-6 flex-1 overflow-y-auto flex flex-col">
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-200 mb-4" />

                <header className="flex justify-between items-center mb-6 shrink-0">
                  <div className="flex items-center gap-2">
                    <Drawer.Title className="font-black text-xl text-gray-900">
                      {isEditMode ? "Daveti Düzenle" : "Davet Detayı"}
                    </Drawer.Title>
                  </div>
                  <button 
                    onClick={() => setSelectedDetailActivity(null)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </header>

                {isEditMode ? (
                  /* EDIT MODE FORM */
                  <div className="space-y-5 flex-1 overflow-y-auto pr-1">
                    <div className="space-y-2">
                      <label className="font-extrabold text-xs text-gray-400 uppercase tracking-wider block">Başlık</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#FF6B6B] font-bold text-gray-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-extrabold text-xs text-gray-400 uppercase tracking-wider block">Konum / Mekan</label>
                      <input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#FF6B6B] font-bold text-gray-800"
                      />
                    </div>

                    {selectedDetailActivity.activityType === "quick_invite" && (
                      <div className="space-y-2">
                        <label className="font-extrabold text-xs text-gray-400 uppercase tracking-wider block">Zaman</label>
                        <input
                          type="text"
                          value={editTimeOption}
                          onChange={(e) => setEditTimeOption(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#FF6B6B] font-bold text-gray-800"
                          placeholder="Zaman bilgisi (örn: Şimdi, Akşam 20:00...)"
                        />
                      </div>
                    )}

                    <div className="pt-4 flex gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditActivity(selectedDetailActivity.id)}
                        disabled={detailLoading}
                        className="flex-1 py-3.5 bg-[#FF6B6B] hover:bg-[#ff5252] disabled:opacity-50 text-white rounded-2xl font-bold text-xs transition-all active:scale-95 cursor-pointer text-center"
                      >
                        {detailLoading ? "Kaydediliyor..." : "Kaydet"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditMode(false)}
                        className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold text-xs transition-all active:scale-95 cursor-pointer text-center"
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                ) : (
                  /* DETAILS VIEW */
                  <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                    {/* Event summary card */}
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FF6B6B]/10 text-[#FF6B6B]">
                          {selectedDetailActivity.activityType === "quick_invite" ? "Hızlı Plan" : "Anketli Plan"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold">
                          Oluşturan: {selectedDetailActivity.creatorId === user.id ? "Ben" : selectedDetailActivity.creatorUsername || "Arkadaşın"}
                        </span>
                      </div>
                      <h3 className="font-black text-xl text-gray-900 leading-tight">
                        {selectedDetailActivity.title}
                      </h3>
                      
                      <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                        {selectedDetailActivity.activityType === "quick_invite" && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
                            <Clock size={16} className="text-[#FF6B6B]" />
                            <span>{selectedDetailActivity.timeOption}{selectedDetailActivity.customTime ? ` (${selectedDetailActivity.customTime})` : ""}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
                          <MapPin size={16} className="text-[#FF6B6B]" />
                          <span>{selectedDetailActivity.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Participant statuses details list */}
                    <div className="space-y-4">
                      <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider px-1">Katılımcı Durumları</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {selectedDetailActivity.responses.map(resp => (
                          <div key={resp.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs font-bold">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                                {resp.avatar ? <img src={resp.avatar} alt="" className="w-full h-full object-cover" /> : "👤"}
                              </div>
                              <span className="text-gray-800">{resp.userId === user.id ? "Ben" : resp.username || "Katılımcı"}</span>
                            </div>

                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              resp.status === "gelirim" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                              resp.status === "belki" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                              resp.status === "gelemem" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                              "bg-gray-100 text-gray-500"
                            }`}>
                              {resp.status === "gelirim" ? "Geliyor" :
                               resp.status === "belki" ? "Belki" :
                               resp.status === "gelemem" ? "Gelemiyor" : "Bekliyor"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* OWNER ACTIONS */}
                    {selectedDetailActivity.creatorId === user.id && (
                      <div className="pt-4 border-t border-gray-100 flex gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsEditMode(true)}
                          className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-xs transition-all active:scale-95 cursor-pointer text-center"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(selectedDetailActivity.id)}
                          disabled={detailLoading}
                          className="flex-1 py-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-2xl font-bold text-xs transition-all active:scale-95 cursor-pointer text-center"
                        >
                          {detailLoading ? "Siliniyor..." : "Sil"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] pointer-events-none">
          <div className={`p-4 rounded-2xl border text-sm font-bold shadow-lg flex items-center justify-center text-center ${
            toast.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Activity Card (Handles Quick Invite + Poll Modes)
interface ActivityCardProps {
  activity: kim_gelir.Activity;
  currentUserId: string;
  onRespond: (activityId: string, status: string, selectedOptions: string[]) => Promise<void>;
  onAddOption: (activityId: string, optionText: string) => Promise<void>;
  actionLoading: string | null;
  onOpenDetails: (activity: kim_gelir.Activity) => void;
}

function ActivityCard({ activity, currentUserId, onRespond, onAddOption, actionLoading, onOpenDetails }: ActivityCardProps) {
  const isPoll = activity.activityType === "plan_poll" || activity.activityType === "time_poll";
  const [showAddInput, setShowAddInput] = useState(false);
  const [optionText, setOptionText] = useState("");
  
  // Find current user's response
  const myInviteResponse = activity.responses.find(r => r.userId === currentUserId);
  const myResponse = myInviteResponse?.status || 'bekliyor';
  const mySelectedOptions = myInviteResponse?.selectedOptions || [];

  // Poll responses calculation
  const totalRespondedUsers = activity.responses.filter(r => r.selectedOptions && r.selectedOptions.length > 0).length;

  const handleToggleVote = (option: string) => {
    const isVoted = mySelectedOptions.includes(option);
    const updated = isVoted 
      ? mySelectedOptions.filter(o => o !== option)
      : [...mySelectedOptions, option];
    
    // Status is 'cevaplandi' if they select any option, else 'bekliyor'
    const status = updated.length > 0 ? "cevaplandi" : "bekliyor";
    onRespond(activity.id, status, updated);
  };

  // Group quick invite answers
  const yesList = activity.responses.filter(r => r.status === 'gelirim');
  const maybeList = activity.responses.filter(r => r.status === 'belki');
  const noList = activity.responses.filter(r => r.status === 'gelemem');
  const pendingList = activity.responses.filter(r => r.status === 'bekliyor');

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[2.2rem] border border-gray-150 p-5 shadow-lg shadow-indigo-100/10 hover:shadow-xl transition-all duration-300">
      {/* Creator Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-150 flex items-center justify-center overflow-hidden shrink-0">
            {activity.creatorAvatar ? (
              <img src={activity.creatorAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : "👤"}
          </div>
          <div className="min-w-0">
            <p className="text-gray-900 font-extrabold text-sm truncate">
              {activity.creatorId === currentUserId ? "Ben" : activity.creatorUsername || "Arkadaşın"}
            </p>
            <p className="text-[10px] text-gray-400 font-medium">davet etti</p>
          </div>
        </div>
        
        {/* Actions & Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={() => onOpenDetails(activity)}
            className="text-[9px] font-black text-[#FF6B6B] hover:text-[#ff5252] bg-rose-50 hover:bg-rose-100/70 px-2 py-1 rounded-lg uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
          >
            Detaylar
          </button>
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-gray-100 text-gray-500">
            {activity.activityType === "quick_invite" ? "Hızlı Plan" : activity.activityType === "plan_poll" ? "Plan Anketi" : "Zaman Anketi"}
          </span>
        </div>
      </div>

      {/* Activity Details Card */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3 mb-5">
        <h3 className="font-black text-base text-gray-900 leading-tight">
          {activity.title}
        </h3>
        
        <div className="flex flex-col gap-2">
          {activity.activityType === "quick_invite" && (
            <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
              <Clock size={16} className="text-[#FF6B6B]" />
              <span>{activity.timeOption}{activity.customTime ? ` (${activity.customTime})` : ""}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
            <MapPin size={16} className="text-[#FF6B6B]" />
            <span className="truncate">{activity.location}</span>
          </div>
        </div>
      </div>

      {/* Interactive Responses Section */}
      {!isPoll ? (
        /* A) Quick Invite Response Buttons */
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <button
            onClick={() => onRespond(activity.id, 'gelirim', [])}
            disabled={actionLoading !== null}
            className={`py-3 px-2 rounded-2xl font-black text-xs flex flex-col items-center gap-1.5 transition-all border cursor-pointer ${
              myResponse === 'gelirim'
                ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-md shadow-emerald-50 scale-[0.97]"
                : "bg-white hover:bg-gray-50 border-gray-150 text-gray-600 active:scale-95"
            }`}
          >
            {actionLoading === `${activity.id}` ? (
              <Spinner size={16} className="animate-spin text-emerald-600" />
            ) : (
              <Check size={16} className={myResponse === 'gelirim' ? "text-emerald-600" : "text-gray-400"} weight="bold" />
            )}
            <span>Gelirim</span>
          </button>

          <button
            onClick={() => onRespond(activity.id, 'belki', [])}
            disabled={actionLoading !== null}
            className={`py-3 px-2 rounded-2xl font-black text-xs flex flex-col items-center gap-1.5 transition-all border cursor-pointer ${
              myResponse === 'belki'
                ? "bg-amber-50 border-amber-300 text-amber-700 shadow-md shadow-amber-50 scale-[0.97]"
                : "bg-white hover:bg-gray-50 border-gray-150 text-gray-600 active:scale-95"
            }`}
          >
            {actionLoading === `${activity.id}` ? (
              <Spinner size={16} className="animate-spin text-amber-600" />
            ) : (
              <Question size={16} className={myResponse === 'belki' ? "text-amber-500" : "text-gray-400"} weight="bold" />
            )}
            <span>Belki</span>
          </button>

          <button
            onClick={() => onRespond(activity.id, 'gelemem', [])}
            disabled={actionLoading !== null}
            className={`py-3 px-2 rounded-2xl font-black text-xs flex flex-col items-center gap-1.5 transition-all border cursor-pointer ${
              myResponse === 'gelemem'
                ? "bg-rose-50 border-rose-300 text-rose-700 shadow-md shadow-rose-50 scale-[0.97]"
                : "bg-white hover:bg-gray-50 border-gray-150 text-gray-600 active:scale-95"
            }`}
          >
            {actionLoading === `${activity.id}` ? (
              <Spinner size={16} className="animate-spin text-rose-600" />
            ) : (
              <X size={16} className={myResponse === 'gelemem' ? "text-rose-600" : "text-gray-400"} weight="bold" />
            )}
            <span>Gelemem</span>
          </button>
        </div>
      ) : (
        /* B/C) Poll Voting Rows */
        <div className="space-y-3 mb-5">
          {activity.options.map((opt, idx) => {
            const isVoted = mySelectedOptions.includes(opt);
            
            // Users who voted for this option
            const voters = activity.responses.filter(r => r.selectedOptions && r.selectedOptions.includes(opt));
            const voteCount = voters.length;
            const percent = totalRespondedUsers > 0 ? (voteCount / totalRespondedUsers) * 100 : 0;

            return (
              <div key={idx} className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleVote(opt)}
                  disabled={actionLoading !== null}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left text-xs font-extrabold transition-all cursor-pointer ${
                    isVoted 
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-inner"
                      : "bg-white border-gray-150 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="truncate pr-4">{opt}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-gray-400">{voteCount} oy</span>
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                      isVoted ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300"
                    }`}>
                      {isVoted && <Check size={12} weight="bold" />}
                    </div>
                  </div>
                </button>

                {/* Progress bar and voter avatars */}
                {voteCount > 0 && (
                  <div className="flex items-center gap-3 px-2 shrink-0">
                    {/* Tiny Progress Bar */}
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${percent}%` }}></div>
                    </div>

                    {/* Voted User Avatars */}
                    <div className="flex -space-x-1 overflow-hidden shrink-0">
                      {voters.map(v => (
                        <div key={v.userId} className="w-5 h-5 rounded-full border border-white overflow-hidden bg-gray-200" title={v.username || "Anonim"}>
                          {v.avatar ? <img src={v.avatar} alt="" className="w-full h-full object-cover" /> : "👤"}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Inline Option Creator */}
          <div className="pt-2">
            {showAddInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={optionText}
                  onChange={(e) => setOptionText(e.target.value)}
                  placeholder="Seçenek yazın... (örn: Sinema, Cuma 20:00)"
                  className="flex-1 bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#FF6B6B] transition-colors font-bold text-gray-800"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!optionText.trim()) return;
                    await onAddOption(activity.id, optionText.trim());
                    setOptionText("");
                    setShowAddInput(false);
                  }}
                  disabled={actionLoading === `add-option-${activity.id}`}
                  className="px-4 py-3 bg-[#FF6B6B] hover:bg-[#ff5252] disabled:opacity-50 text-white rounded-2xl font-bold text-xs transition-all active:scale-95 cursor-pointer"
                >
                  Ekle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddInput(false);
                    setOptionText("");
                  }}
                  className="px-3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl font-bold text-xs transition-all active:scale-95 cursor-pointer"
                >
                  İptal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddInput(true)}
                className="w-full py-3.5 border-2 border-dashed border-gray-200 hover:border-[#FF6B6B]/40 hover:bg-rose-50/10 text-gray-500 hover:text-[#FF6B6B] rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <Plus size={14} weight="bold" />
                Seçenek Ekle
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Invite Participants Footer Lists */}
      {!isPoll && (
        <div className="space-y-3 pt-3 border-t border-gray-100">
          {/* Gelirim list */}
          {yesList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black text-emerald-600 uppercase w-12 shrink-0">Gelenler:</span>
              <div className="flex flex-wrap gap-1">
                {yesList.map(r => (
                  <div key={r.userId} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-emerald-100">
                    <div className="w-3.5 h-3.5 rounded-full overflow-hidden bg-emerald-100">
                      {r.avatar ? <img src={r.avatar} alt="" className="w-full h-full object-cover" /> : "👤"}
                    </div>
                    <span>{r.userId === currentUserId ? "Ben" : r.username || "Anonim"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Belki list */}
          {maybeList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black text-amber-600 uppercase w-12 shrink-0">Belki:</span>
              <div className="flex flex-wrap gap-1">
                {maybeList.map(r => (
                  <div key={r.userId} className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-amber-100">
                    <div className="w-3.5 h-3.5 rounded-full overflow-hidden bg-amber-100">
                      {r.avatar ? <img src={r.avatar} alt="" className="w-full h-full object-cover" /> : "👤"}
                    </div>
                    <span>{r.userId === currentUserId ? "Ben" : r.username || "Anonim"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gelemem list */}
          {noList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black text-rose-600 uppercase w-12 shrink-0">Gelemeyen:</span>
              <div className="flex flex-wrap gap-1">
                {noList.map(r => (
                  <div key={r.userId} className="flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-rose-100">
                    <div className="w-3.5 h-3.5 rounded-full overflow-hidden bg-rose-100">
                      {r.avatar ? <img src={r.avatar} alt="" className="w-full h-full object-cover" /> : "👤"}
                    </div>
                    <span>{r.userId === currentUserId ? "Ben" : r.username || "Anonim"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bekliyor list */}
          {pendingList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black text-gray-400 uppercase w-12 shrink-0">Cevapsız:</span>
              <div className="flex flex-wrap gap-1">
                {pendingList.map(r => (
                  <div key={r.userId} className="flex items-center gap-1 bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-gray-100">
                    <div className="w-3.5 h-3.5 rounded-full overflow-hidden bg-gray-100">
                      {r.avatar ? <img src={r.avatar} alt="" className="w-full h-full object-cover" /> : "👤"}
                    </div>
                    <span>{r.userId === currentUserId ? "Ben" : r.username || "Anonim"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function KimGelirPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <main className="flex-1 flex items-center justify-center">
          <Spinner size={32} className="text-[#FF6B6B] animate-spin" />
        </main>
      </div>
    }>
      <KimGelirContent />
    </Suspense>
  );
}
