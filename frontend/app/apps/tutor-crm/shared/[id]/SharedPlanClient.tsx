"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { 
  Calendar, 
  Clock, 
  CaretLeft,
  CaretRight,
  GraduationCap,
  List,
  Plus,
  ArrowLeft,
  Check
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { tutor_crm } from "@/lib/client";

const client = createBrowserClient();

export default function SharedPlanClient({ id }: { id: string }) {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const shareId = id;

  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<tutor_crm.Lesson[]>([]);
  const [calendarView, setCalendarView] = useState<"grid" | "list">("grid");
  const [isFollowing, setIsFollowing] = useState(false);
  const [alias, setAlias] = useState("Takip Edilen Plan");

  // Calendar week state
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(date.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon;
  };

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()));

  const changeWeek = (direction: number) => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(currentWeekStart.getDate() + direction * 7);
    setCurrentWeekStart(nextWeek);
  };

  const setTodayWeek = () => {
    setCurrentWeekStart(getMonday(new Date()));
  };

  const getDaysOfWeek = (monday: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const formatDatePickerDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const days = getDaysOfWeek(currentWeekStart);

  const generateTimeSlots = () => {
    const slots = ["07:30"];
    for (let h = 8; h <= 23; h++) {
      const hourStr = h.toString().padStart(2, "0");
      slots.push(`${hourStr}:00`);
      slots.push(`${hourStr}:30`);
    }
    slots.push("00:00");
    return slots;
  };
  const timeSlots = generateTimeSlots();
  const slotHeight = 24;

  const getLessonDurationSlots = (start: string, end: string) => {
    const [sH, sM] = start.split(":").map(Number);
    const [eH, eM] = end.split(":").map(Number);
    const startMin = sH * 60 + sM;
    const endMin = eH * 60 + eM;
    const diff = endMin - startMin;
    return Math.max(1, Math.ceil(diff / 30));
  };

  const fetchSharedLessons = async () => {
    try {
      setLoading(true);
      const res = await client.tutor_crm.getSharedLessons(shareId);
      setLessons(res.lessons);

      // If user is loaded, check if we already follow this plan
      if (user) {
        const followRes = await client.tutor_crm.getFollowedShares(user.id);
        const exists = followRes.followed.some(f => f.share_id === shareId);
        setIsFollowing(exists);
      }
    } catch (err) {
      toast.error("Paylaşılan plan yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shareId) {
      fetchSharedLessons();
    }
  }, [shareId, user]);

  const handleFollowPlan = async () => {
    if (!user) {
      toast.error("Planı takip etmek için giriş yapmalısınız.");
      return;
    }
    try {
      await client.tutor_crm.followShare({
        userId: user.id,
        shareId,
        alias: alias.trim() || "Takip Edilen Plan"
      });
      setIsFollowing(true);
      toast.success("Plan takip listenize eklendi!");
    } catch (err) {
      toast.error("Takip etme işlemi başarısız oldu.");
    }
  };

  const formatWeekRange = () => {
    const start = days[0];
    const end = days[6];
    const startMonth = start.toLocaleDateString("tr-TR", { month: "short" });
    const endMonth = end.toLocaleDateString("tr-TR", { month: "short" });
    const startDay = start.getDate();
    const endDay = end.getDate();
    const year = start.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${startMonth} ${year}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-12">
      <Toaster position="top-center" />

      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={() => router.push("/apps/tutor-crm")}
              className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-500"
            >
              <ArrowLeft size={20} weight="bold" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <GraduationCap size={28} weight="fill" className="text-blue-600" />
            <div>
              <h1 className="text-base font-black text-gray-900 uppercase tracking-tight">
                Tutor <span className="text-blue-600">Place</span>
              </h1>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Paylaşılan Plan</p>
            </div>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-2">
            {isFollowing ? (
              <span className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                <Check size={14} weight="bold" /> Takip Ediliyor
              </span>
            ) : (
              <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200">
                <input 
                  type="text" 
                  placeholder="İsim verin (örn: Ahmet Hoca)" 
                  value={alias}
                  onChange={e => setAlias(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none px-2 py-1 w-44"
                />
                <button
                  onClick={handleFollowPlan}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all"
                >
                  <Plus size={12} weight="bold" /> Takip Et
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex items-center gap-3.5 text-blue-800">
          <Calendar size={24} weight="fill" className="shrink-0 text-blue-600" />
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider">Paylaşılan Plan Görünümü (Salt Okunur)</h4>
            <p className="text-xs mt-0.5 opacity-90 font-medium">Bu ders planı bir öğretmen tarafından paylaşılmıştır. Saatleri ve günleri inceleyebilir, kendisiyle ders ayarlayabilirsiniz.</p>
          </div>
        </div>

        {/* TOP TOOLBAR */}
        {!loading && (
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-white p-3 sm:px-5 sm:py-3 rounded-2xl border border-gray-100 w-full">
            <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto">
              <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full sm:w-auto justify-center sm:justify-start">
                {/* Week Navigation */}
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => changeWeek(-1)}
                    className="p-2 hover:bg-gray-50 border border-gray-100 rounded-lg transition-all bg-white shadow-sm"
                  >
                    <CaretLeft size={14} weight="bold" className="text-gray-600" />
                  </button>
                  <button 
                    onClick={setTodayWeek}
                    className="px-2.5 py-1.5 hover:bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-black uppercase text-gray-600 transition-all bg-white shadow-sm"
                  >
                    Bugün
                  </button>
                  <span className="text-[10px] sm:text-xs font-black text-gray-800 tracking-tight px-1.5 text-center min-w-[100px] sm:min-w-[130px]">
                    {formatWeekRange()}
                  </span>
                  <button 
                    onClick={() => changeWeek(1)}
                    className="p-2 hover:bg-gray-50 border border-gray-100 rounded-lg transition-all bg-white shadow-sm"
                  >
                    <CaretRight size={14} weight="bold" className="text-gray-600" />
                  </button>
                </div>

                {/* Vertical separator */}
                <div className="hidden sm:block h-5 w-px bg-gray-200 shrink-0" />

                {/* Grid vs List view toggle */}
                <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/50 shrink-0">
                  <button
                    onClick={() => setCalendarView("grid")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all ${calendarView === "grid"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                      }`}
                  >
                    <Calendar size={12} weight="bold" />
                    <span>Takvim</span>
                  </button>
                  <button
                    onClick={() => setCalendarView("list")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all ${calendarView === "list"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                      }`}
                  >
                    <List size={12} weight="bold" />
                    <span>Liste</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTENT */}
        {loading ? (
          <div className="py-20 text-center text-gray-450 font-bold uppercase tracking-widest text-xs animate-pulse">
            Yükleniyor...
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {calendarView === "grid" ? (
              <div key="grid" className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden select-none">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] table-fixed border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="w-12 py-2 px-1 text-[8px] font-black uppercase text-gray-400 text-center tracking-widest border-r border-gray-100">
                          Saat
                        </th>
                        {days.map((day, idx) => {
                          const isToday = formatDatePickerDate(day) === formatDatePickerDate(new Date());
                          return (
                            <th key={idx} className="py-2 px-1 border-r border-gray-100 last:border-r-0">
                              <div className="flex flex-col items-center gap-0.5">
                                <span className={`font-black uppercase tracking-widest text-[8px] ${isToday ? "text-blue-600" : "text-gray-400"}`}>
                                  {day.toLocaleDateString("tr-TR", { weekday: "narrow" })}
                                </span>
                                <span className={`rounded-full flex items-center justify-center font-black w-5 h-5 text-xs ${isToday ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-900"}`}>
                                  {day.getDate()}
                                </span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="align-top">
                        <td className="p-0 border-r border-gray-100 bg-gray-50/50 w-12">
                          {timeSlots.map((timeSlot) => {
                            const isFullHourLine = timeSlot.endsWith(":30");
                            return (
                              <div
                                key={timeSlot}
                                style={{ height: `${slotHeight}px` }}
                                className={`relative w-full border-b last:border-b-0 ${isFullHourLine ? "border-gray-200" : "border-gray-100"}`}
                              >
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-gray-400 bg-[#F8F9FA] px-1 text-[8px]">
                                  {timeSlot === "07:30" ? "" : timeSlot}
                                </span>
                              </div>
                            );
                          })}
                        </td>

                        {days.map((day, dayIdx) => {
                          const dateStr = formatDatePickerDate(day);
                          const dayLessons = lessons.filter(l => l.lesson_date === dateStr);
                          
                          return (
                            <td key={dayIdx} className="p-0 relative border-r border-gray-100 last:border-r-0 bg-white">
                              {/* Background grid lines */}
                              {timeSlots.map((timeSlot) => {
                                const isFullHourLine = timeSlot.endsWith(":30");
                                return (
                                  <div
                                    key={timeSlot}
                                    style={{ height: `${slotHeight}px` }}
                                    className={`w-full border-b last:border-b-0 ${isFullHourLine ? "border-gray-150" : "border-gray-50"}`}
                                  />
                                );
                              })}

                              {/* Lessons container */}
                              <div className="absolute inset-0 top-0 left-0 pointer-events-none">
                                {dayLessons.map(lesson => {
                                  const startIdx = timeSlots.indexOf(lesson.start_time.slice(0, 5));
                                  const durationSlots = getLessonDurationSlots(lesson.start_time, lesson.end_time);
                                  
                                  const startStr = lesson.start_time.slice(0, 5);
                                  const endStr = lesson.end_time.slice(0, 5);

                                  return (
                                    <div
                                      key={lesson.id}
                                      style={{
                                        top: `${startIdx * slotHeight}px`,
                                        height: `${durationSlots * slotHeight - 2}px`,
                                        left: "4px",
                                        width: "calc(100% - 8px)"
                                      }}
                                      className="absolute rounded bg-blue-50 border-l-[3px] border-l-blue-600 p-1 pointer-events-auto transition-all overflow-hidden flex flex-col justify-center text-left"
                                    >
                                      <div className="min-w-0">
                                        {durationSlots === 1 ? (
                                          <p className="font-bold text-gray-900 truncate leading-none text-[9px] flex items-center justify-between gap-1 w-full">
                                            <span className="truncate">{lesson.student_name}</span>
                                            <span className="text-blue-600 shrink-0 font-extrabold text-[8px]">{startStr}</span>
                                          </p>
                                        ) : (
                                          <>
                                            <p className="font-black text-gray-900 leading-tight truncate text-[10px] mb-0.5">
                                              {lesson.student_name}
                                            </p>
                                            <p className="font-bold text-blue-600 uppercase tracking-wide leading-none text-[8px]">
                                              {startStr} - {endStr}
                                            </p>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div key="list" className="space-y-4 w-full">
                {lessons.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm text-gray-400">
                    Planlanmış ders bulunamadı.
                  </div>
                ) : (
                  lessons.map(lesson => (
                    <div key={lesson.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                          <Clock size={24} weight="bold" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {new Date(lesson.lesson_date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          <h3 className="font-black text-gray-900 text-lg mt-0.5">{lesson.student_name}</h3>
                          <p className="font-bold text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                            <Clock size={16} /> {lesson.start_time.slice(0, 5)} - {lesson.end_time.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
