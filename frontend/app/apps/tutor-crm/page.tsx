"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { 
  Users, 
  Calendar, 
  BookOpen, 
  CreditCard, 
  Plus, 
  Trash, 
  CheckCircle, 
  Clock, 
  CaretLeft,
  CaretRight,
  GraduationCap,
  Money,
  Check,
  List,
  GridFour,
  X
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import Client, { tutor_crm } from "@/lib/client";
import { useRouter } from "next/navigation";

const client = new Client("http://localhost:4000");

type TabType = "students" | "schedule" | "homework" | "payments";
type CalendarViewType = "grid" | "list";

export default function TutorCRMPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>("students");
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<tutor_crm.Student[]>([]);
  const [lessons, setLessons] = useState<tutor_crm.Lesson[]>([]);
  const [homeworks, setHomeworks] = useState<tutor_crm.Homework[]>([]);
  const [payments, setPayments] = useState<tutor_crm.Payment[]>([]);
  
  // Calendar-specific states
  const [calendarView, setCalendarView] = useState<CalendarViewType>("grid");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Drawer & Form control states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formPreFill, setFormPreFill] = useState<{
    date?: string;
    startTime?: string;
    endTime?: string;
  }>({});
  
  // Lesson Detail view modal state
  const [selectedLesson, setSelectedLesson] = useState<tutor_crm.Lesson | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (isUserLoaded && user) {
      fetchAllData();
    }
  }, [isUserLoaded, user]);

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [sRes, lRes, hRes, pRes] = await Promise.all([
        client.tutor_crm.getStudents(user.id),
        client.tutor_crm.getLessons(user.id),
        client.tutor_crm.getHomeworks(user.id),
        client.tutor_crm.getPayments(user.id)
      ]);
      setStudents(sRes.students);
      setLessons(lRes.lessons);
      setHomeworks(hRes.homeworks);
      setPayments(pRes.payments);
    } catch (error) {
      console.error("fetch error:", error);
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!user) return;
    try {
      await client.tutor_crm.deleteStudent(id, { userId: user.id });
      setStudents(students.filter(s => s.id !== id));
      toast.success("Öğrenci silindi");
    } catch (error) {
      toast.error("Hata oluştu");
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!user) return;
    try {
      await client.tutor_crm.deleteLesson(id, { userId: user.id });
      setLessons(lessons.filter(l => l.id !== id));
      setSelectedLesson(null);
      toast.success("Ders iptal edildi/silindi");
    } catch (error) {
      toast.error("Hata oluştu");
    }
  };

  const handleToggleHomework = async (id: string) => {
    if (!user) return;
    try {
      await client.tutor_crm.toggleHomework({ id, userId: user.id });
      setHomeworks(homeworks.map(h => h.id === id ? { ...h, is_completed: !h.is_completed } : h));
      toast.success("Durum güncellendi");
    } catch (error) {
      toast.error("Hata oluştu");
    }
  };

  const handleTogglePayment = async (id: string) => {
    if (!user) return;
    try {
      await client.tutor_crm.togglePayment({ id, userId: user.id });
      setPayments(payments.map(p => p.id === id ? { ...p, is_paid: !p.is_paid } : p));
      toast.success("Ödeme durumu güncellendi");
    } catch (error) {
      toast.error("Hata oluştu");
    }
  };

  // Helper date calculations for the grid
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(date.setDate(diff));
    mon.setHours(0,0,0,0);
    return mon;
  };

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
    const slots = [];
    for (let h = 8; h <= 21; h++) {
      const hourStr = h.toString().padStart(2, "0");
      slots.push(`${hourStr}:00`);
      slots.push(`${hourStr}:30`);
    }
    slots.push("22:00");
    return slots;
  };
  const timeSlots = generateTimeSlots();

  const getLessonDurationSlots = (start: string, end: string) => {
    const [sH, sM] = start.split(":").map(Number);
    const [eH, eM] = end.split(":").map(Number);
    const startMin = sH * 60 + sM;
    const endMin = eH * 60 + eM;
    const diff = endMin - startMin;
    return Math.max(1, Math.ceil(diff / 30));
  };

  const getDayLessonsMap = (day: Date) => {
    const dateStr = formatDatePickerDate(day);
    const dayLessons = lessons.filter(l => l.lesson_date === dateStr);
    const map: Record<string, { lesson: tutor_crm.Lesson; rowSpan: number }> = {};
    const covered = new Set<string>();

    dayLessons.forEach(lesson => {
      const startStr = lesson.start_time.slice(0, 5);
      const endStr = lesson.end_time.slice(0, 5);
      const rowSpan = getLessonDurationSlots(startStr, endStr);
      map[startStr] = { lesson, rowSpan };
      
      const [sH, sM] = startStr.split(":").map(Number);
      for (let i = 1; i < rowSpan; i++) {
        const totalMins = sH * 60 + sM + i * 30;
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        const covTimeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        covered.add(covTimeStr);
      }
    });

    return { map, covered };
  };

  // Click handler for scheduling from grid cells
  const handleGridCellClick = (day: Date, timeSlot: string) => {
    const dateStr = formatDatePickerDate(day);
    
    // Add 30 mins to calculate end time
    const [h, m] = timeSlot.split(":").map(Number);
    const totalEndMins = h * 60 + m + 30;
    const endH = Math.floor(totalEndMins / 60);
    const endM = totalEndMins % 60;
    const endTimeStr = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

    setFormPreFill({
      date: dateStr,
      startTime: timeSlot,
      endTime: endTimeStr
    });
    setActiveTab("schedule");
    setIsDrawerOpen(true);
  };

  // Format week range label (e.g. "1 Haz - 7 Haz 2026")
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

  const navItems = [
    { id: "students", label: "Öğrenciler", icon: Users },
    { id: "schedule", label: "Takvim & Plan", icon: Calendar },
    { id: "homework", label: "Ödevler", icon: BookOpen },
    { id: "payments", label: "Ödemeler", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row">
      <Toaster position="top-center" />

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-80 bg-white border-r border-gray-100 p-6 shrink-0 h-screen sticky top-0 justify-between shadow-sm">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push("/home")}
              className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <CaretLeft size={20} weight="bold" className="text-gray-400" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                <GraduationCap size={24} weight="fill" className="text-blue-600" />
                Tutor <span className="text-blue-600">CRM</span>
              </h1>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Planner & Manager</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TabType);
                  setFormPreFill({}); // Reset pre-fill
                }}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                  activeTab === item.id 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                <item.icon size={20} weight={activeTab === item.id ? "fill" : "bold"} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Stats */}
        <div className="bg-gray-50 p-4 rounded-2rem border border-gray-100 space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CRM Genel Durum</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <span className="text-xs text-gray-400 font-bold block">Öğrenci</span>
              <span className="text-lg font-black text-gray-900">{students.length}</span>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <span className="text-xs text-gray-400 font-bold block">Dersler</span>
              <span className="text-lg font-black text-gray-900">{lessons.length}</span>
            </div>
          </div>
          <button 
            onClick={() => router.push("/home")} 
            className="w-full text-center text-xs font-bold text-gray-400 hover:text-gray-600 block py-1"
          >
            ← Ana Sayfaya Dön
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-white border-b border-gray-100 px-6 py-6 sticky top-0 z-30 flex items-center justify-between">
        <button 
          onClick={() => router.push("/home")}
          className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <CaretLeft size={22} weight="bold" className="text-gray-400" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">Tutor <span className="text-blue-600">CRM</span></h1>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Planner & Manager</p>
        </div>
        <div className="w-8" />
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-x-hidden">
        {/* Mobile-only scrolling tabs */}
        <div className="md:hidden flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as TabType);
                setFormPreFill({});
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === item.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                  : "bg-white text-gray-400 hover:text-gray-600 border border-gray-100"
              }`}
            >
              <item.icon size={18} weight={activeTab === item.id ? "fill" : "bold"} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Wrapper */}
        <div className="space-y-6">
          {loading ? (
            <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">
              Yükleniyor...
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* STUDENTS TAB */}
              {activeTab === "students" && (
                <motion.div 
                  key="students"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 max-w-3xl"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Öğrencileriniz</h2>
                  </div>
                  {students.length === 0 ? (
                    <EmptyState icon={Users} title="Öğrenci Bulunamadı" description="İlk öğrencinizi ekleyerek başlayın." />
                  ) : (
                    students.map(student => (
                      <div key={student.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group transition-all hover:shadow-md">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 text-base">{student.name}</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">{student.subject} • {student.level}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-gray-400 uppercase">Saatlik Ücret</p>
                            <p className="font-black text-gray-900 text-lg">{student.hourly_rate}₺</p>
                          </div>
                          {student.parent_contact && (
                            <div className="text-right hidden md:block">
                              <p className="text-[10px] font-black text-gray-400 uppercase">İletişim</p>
                              <p className="text-sm font-bold text-gray-600">{student.parent_contact}</p>
                            </div>
                          )}
                          <button onClick={() => handleDeleteStudent(student.id)} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <Trash size={20} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {/* SCHEDULE / GRID TAB */}
              {activeTab === "schedule" && (
                <motion.div 
                  key="schedule"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Calendar Toolbar */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
                    {/* View Switcher */}
                    <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                      <button
                        onClick={() => setCalendarView("grid")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          calendarView === "grid" 
                            ? "bg-white text-gray-900 shadow-sm font-black" 
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <GridFour size={16} weight="bold" />
                        <span>Haftalık Plan</span>
                      </button>
                      <button
                        onClick={() => setCalendarView("list")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          calendarView === "list" 
                            ? "bg-white text-gray-900 shadow-sm font-black" 
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <List size={16} weight="bold" />
                        <span>Liste</span>
                      </button>
                    </div>

                    {/* Week Navigation */}
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => changeWeek(-1)}
                        className="p-2 hover:bg-gray-50 border border-gray-100 rounded-xl transition-colors"
                      >
                        <CaretLeft size={20} weight="bold" className="text-gray-600" />
                      </button>
                      <button 
                        onClick={setTodayWeek}
                        className="px-4 py-2 hover:bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 transition-colors"
                      >
                        Bugün
                      </button>
                      <span className="text-sm font-black text-gray-800 tracking-tight min-w-[140px] text-center">
                        {formatWeekRange()}
                      </span>
                      <button 
                        onClick={() => changeWeek(1)}
                        className="p-2 hover:bg-gray-50 border border-gray-100 rounded-xl transition-colors"
                      >
                        <CaretRight size={20} weight="bold" className="text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Views */}
                  {calendarView === "grid" ? (
                    /* WEEKLY HOUR GRID */
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] table-fixed border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              {/* Empty corner header for times */}
                              <th className="w-20 py-4 px-3 text-[10px] font-black uppercase text-gray-400 text-center tracking-widest border-r border-gray-100">Saat</th>
                              {days.map((day, idx) => {
                                const isToday = formatDatePickerDate(day) === formatDatePickerDate(new Date());
                                return (
                                  <th key={idx} className="py-4 px-3 border-r border-gray-100 last:border-r-0">
                                    <div className="flex flex-col items-center gap-0.5">
                                      <span className={`text-[10px] font-black uppercase tracking-widest ${isToday ? "text-blue-600" : "text-gray-400"}`}>
                                        {day.toLocaleDateString("tr-TR", { weekday: "short" })}
                                      </span>
                                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${
                                        isToday ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-900"
                                      }`}>
                                        {day.getDate()}
                                      </span>
                                    </div>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {timeSlots.map((timeSlot) => {
                              // We prepare lesson check maps for this timeslot across all days to optimize
                              return (
                                <tr key={timeSlot} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/20 group/row">
                                  {/* Slot label */}
                                  <td className="py-2.5 px-3 border-r border-gray-100 text-center font-bold text-gray-400 text-xs tracking-tight bg-gray-50/50">
                                    {timeSlot}
                                  </td>
                                  
                                  {/* 7 Days of column slots */}
                                  {days.map((day, dayIdx) => {
                                    const { map, covered } = getDayLessonsMap(day);
                                    
                                    // If this cell is occupied by a lesson that started earlier (rowSpan covers it)
                                    if (covered.has(timeSlot)) {
                                      return null;
                                    }

                                    // If a lesson starts in this cell
                                    if (map[timeSlot]) {
                                      const { lesson, rowSpan } = map[timeSlot];
                                      return (
                                        <td 
                                          key={dayIdx} 
                                          rowSpan={rowSpan}
                                          className="p-1 border-r border-gray-100 last:border-r-0 align-top"
                                        >
                                          <div 
                                            onClick={() => setSelectedLesson(lesson)}
                                            className="h-full bg-blue-50 hover:bg-blue-100/80 border-l-4 border-blue-600 rounded-xl p-2.5 text-left cursor-pointer transition-all hover:shadow-sm"
                                          >
                                            <p className="font-black text-gray-900 text-xs leading-tight mb-0.5 truncate">
                                              {lesson.student_name}
                                            </p>
                                            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wide leading-none">
                                              {lesson.start_time.slice(0,5)} - {lesson.end_time.slice(0,5)}
                                            </p>
                                            {lesson.notes && (
                                              <p className="text-[10px] text-gray-500 font-medium mt-1 truncate max-w-full">
                                                {lesson.notes}
                                              </p>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    }

                                    // Empty Slot: Clickable to Schedule a new lesson
                                    return (
                                      <td 
                                        key={dayIdx} 
                                        onClick={() => handleGridCellClick(day, timeSlot)}
                                        className="py-2.5 px-3 border-r border-gray-100 last:border-r-0 cursor-pointer hover:bg-blue-50/40 relative group transition-all"
                                      >
                                        <span className="absolute inset-0 flex items-center justify-center text-blue-600/0 group-hover:text-blue-600/70 font-black text-lg transition-all">
                                          <Plus size={16} weight="bold" />
                                        </span>
                                        {/* Silent space placeholder */}
                                        <div className="h-6" />
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    /* LIST VIEW */
                    <div className="space-y-4 max-w-3xl">
                      {lessons.length === 0 ? (
                        <EmptyState icon={Calendar} title="Ders Bulunamadı" description="Henüz planlanmış bir dersiniz yok." />
                      ) : (
                        lessons.map(lesson => (
                          <div key={lesson.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all">
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
                                  <Clock size={16} /> {lesson.start_time.slice(0,5)} - {lesson.end_time.slice(0,5)}
                                </p>
                                {lesson.notes && <p className="text-sm text-gray-400 mt-2 italic">"{lesson.notes}"</p>}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 self-stretch sm:self-center justify-between sm:justify-end">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                lesson.status === 'completed' ? 'bg-green-50 text-green-600' : 
                                lesson.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                                {lesson.status === 'completed' ? 'Tamamlandı' : lesson.status === 'cancelled' ? 'İptal' : 'Planlandı'}
                              </span>
                              
                              <button 
                                onClick={() => handleDeleteLesson(lesson.id)} 
                                className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash size={20} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* HOMEWORK TAB */}
              {activeTab === "homework" && (
                <motion.div 
                  key="homework"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 max-w-3xl"
                >
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Ödev Takibi</h2>
                  {homeworks.length === 0 ? (
                    <EmptyState icon={BookOpen} title="Ödev Bulunamadı" description="Öğrencilerinize ödev atayarak takibini yapın." />
                  ) : (
                    homeworks.map(hw => (
                      <div key={hw.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => handleToggleHomework(hw.id)}
                            className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                              hw.is_completed ? "bg-green-500 border-green-500 text-white" : "border-gray-200 text-transparent hover:border-gray-300"
                            }`}
                          >
                            <Check size={16} weight="bold" />
                          </button>
                          <div>
                            <h3 className={`font-black text-sm ${hw.is_completed ? "text-gray-400 line-through" : "text-gray-900"}`}>{hw.task}</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{hw.student_name} {hw.due_date && `• ${new Date(hw.due_date).toLocaleDateString('tr-TR')}`}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {/* PAYMENTS TAB */}
              {activeTab === "payments" && (
                <motion.div 
                  key="payments"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 max-w-3xl"
                >
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Ödemeler ve Kazançlar</h2>
                  {payments.length === 0 ? (
                    <EmptyState icon={CreditCard} title="Ödeme Bulunamadı" description="Ödemeleri takip ederek kazancınızı yönetin." />
                  ) : (
                    payments.map(payment => (
                      <div key={payment.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${payment.is_paid ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                            <Money size={24} weight="fill" />
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 text-lg">{payment.amount}₺</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{payment.student_name} • {payment.lesson_count} Ders</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleTogglePayment(payment.id)}
                          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            payment.is_paid ? "bg-green-500 text-white shadow-md shadow-green-150" : "bg-gray-100 text-gray-400 hover:bg-gray-250"
                          }`}
                        >
                          {payment.is_paid ? "Ödendi" : "Bekliyor"}
                        </button>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* DETAILED LESSON INFO DIALOG/MODAL */}
      <AnimatePresence>
        {selectedLesson && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative border border-gray-100"
            >
              <button 
                onClick={() => setSelectedLesson(null)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <X size={20} weight="bold" />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Clock size={24} weight="bold" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Ders Detayı</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Planlanmış Seans Bilgileri</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="text-[9px] font-black text-gray-400 uppercase block tracking-wider mb-1">Öğrenci</span>
                  <span className="text-base font-black text-gray-900">{selectedLesson.student_name}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase block tracking-wider mb-1">Tarih</span>
                    <span className="text-sm font-bold text-gray-900">
                      {new Date(selectedLesson.lesson_date).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase block tracking-wider mb-1">Saat Aralığı</span>
                    <span className="text-sm font-bold text-gray-900">
                      {selectedLesson.start_time.slice(0,5)} - {selectedLesson.end_time.slice(0,5)}
                    </span>
                  </div>
                </div>

                {selectedLesson.notes && (
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase block tracking-wider mb-1">Ders Notu</span>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">{selectedLesson.notes}</p>
                  </div>
                )}
                
                {selectedLesson.next_lesson_plan && (
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase block tracking-wider mb-1">Gelecek Ders Planı</span>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">{selectedLesson.next_lesson_plan}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => handleDeleteLesson(selectedLesson.id)}
                  className="flex-1 bg-red-50 hover:bg-red-100/70 text-red-600 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <Trash size={16} />
                  <span>Dersi Sil / İptal Et</span>
                </button>
                <button 
                  onClick={() => setSelectedLesson(null)}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD NEW ITEM FAB & DRAWER */}
      <div className="fixed bottom-10 left-0 right-0 md:right-10 md:left-auto flex justify-center px-6 z-40">
        <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <Drawer.Trigger asChild>
            <button className="bg-gray-900 text-white w-full max-w-md md:w-56 h-16 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
              <Plus size={20} weight="bold" />
              <span className="uppercase tracking-widest text-xs">Yeni Kayıt Ekle</span>
            </button>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
            <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[60] max-w-2xl mx-auto">
              <div className="p-8 overflow-y-auto">
                <div className="mx-auto w-12 h-1.5 rounded-full bg-gray-100 mb-8" />
                <Drawer.Title className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight">Yeni <span className="text-blue-600">Kayıt</span></Drawer.Title>
                <AddForm 
                  activeTab={activeTab} 
                  students={students} 
                  preFill={formPreFill}
                  onComplete={() => { 
                    setIsDrawerOpen(false);
                    setFormPreFill({});
                    fetchAllData(); 
                  }} 
                />
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="py-20 flex flex-col items-center text-center px-10 bg-white rounded-[3rem] border border-dashed border-gray-200">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-6">
        <Icon size={32} />
      </div>
      <h3 className="font-black text-gray-900 mb-2 uppercase tracking-tight">{title}</h3>
      <p className="text-sm text-gray-400 font-medium">{description}</p>
    </div>
  );
}

interface FormPreFillProps {
  date?: string;
  startTime?: string;
  endTime?: string;
}

function AddForm({ 
  activeTab, 
  students, 
  preFill,
  onComplete 
}: { 
  activeTab: TabType; 
  students: tutor_crm.Student[]; 
  preFill: FormPreFillProps;
  onComplete: () => void;
}) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  
  // Decide active subform type. If preFill date or time is present, default to 'schedule'
  const [type, setType] = useState<TabType>(() => {
    if (preFill.date || preFill.startTime) {
      return "schedule";
    }
    return activeTab;
  });

  // Reset type if the overall selected tab changes and no pre-fill is active
  useEffect(() => {
    if (!preFill.date && !preFill.startTime) {
      setType(activeTab);
    }
  }, [activeTab, preFill]);

  // Student Form
  const [studentData, setStudentData] = useState({
    name: "", subject: "", level: "", parentContact: "", hourlyRate: "200"
  });

  // Lesson Form (with pre-fill defaults if present)
  const [lessonData, setLessonData] = useState({
    studentId: "", 
    date: preFill.date || new Date().toISOString().split('T')[0], 
    start: preFill.startTime || "18:00", 
    end: preFill.endTime || "19:00", 
    notes: "", 
    nextPlan: ""
  });

  // Homework Form
  const [homeworkData, setHomeworkData] = useState({
    studentId: "", task: "", dueDate: ""
  });

  // Payment Form
  const [paymentData, setPaymentData] = useState({
    studentId: "", amount: "", isPaid: false, count: "1"
  });

  // Re-run setLessonData when preFill changes
  useEffect(() => {
    if (preFill.date || preFill.startTime) {
      setLessonData(prev => ({
        ...prev,
        date: preFill.date || prev.date,
        start: preFill.startTime || prev.start,
        end: preFill.endTime || prev.end
      }));
      setType("schedule");
    }
  }, [preFill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      if (type === "students") {
        await client.tutor_crm.addStudent({
          userId: user.id,
          name: studentData.name,
          subject: studentData.subject,
          level: studentData.level,
          parentContact: studentData.parentContact,
          hourlyRate: parseFloat(studentData.hourlyRate)
        });
      } else if (type === "schedule") {
        if (!lessonData.studentId) {
          toast.error("Lütfen bir öğrenci seçin");
          setLoading(false);
          return;
        }
        await client.tutor_crm.addLesson({
          userId: user.id,
          studentId: lessonData.studentId,
          lessonDate: lessonData.date,
          startTime: lessonData.start,
          endTime: lessonData.end,
          notes: lessonData.notes,
          nextLessonPlan: lessonData.nextPlan
        });
      } else if (type === "homework") {
        if (!homeworkData.studentId) {
          toast.error("Lütfen bir öğrenci seçin");
          setLoading(false);
          return;
        }
        await client.tutor_crm.addHomework({
          userId: user.id,
          studentId: homeworkData.studentId,
          task: homeworkData.task,
          dueDate: homeworkData.dueDate || undefined
        });
      } else if (type === "payments") {
        if (!paymentData.studentId) {
          toast.error("Lütfen bir öğrenci seçin");
          setLoading(false);
          return;
        }
        await client.tutor_crm.addPayment({
          userId: user.id,
          studentId: paymentData.studentId,
          amount: parseFloat(paymentData.amount),
          isPaid: paymentData.isPaid,
          lessonCount: parseInt(paymentData.count),
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        });
      }
      toast.success("Başarıyla eklendi");
      onComplete();
    } catch (error) {
      toast.error("Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-10">
      <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl mb-8">
        {[
          { id: "students", label: "Öğrenci" },
          { id: "schedule", label: "Ders" },
          { id: "homework", label: "Ödev" },
          { id: "payments", label: "Ödeme" },
        ].map(t => (
          <button 
            key={t.id} 
            type="button"
            onClick={() => setType(t.id as TabType)}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              type === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {type === "students" && (
        <div className="space-y-4">
          <Input label="Öğrenci Adı" value={studentData.name} onChange={v => setStudentData({...studentData, name: v})} placeholder="Örn: Ayşe Yılmaz" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ders" value={studentData.subject} onChange={v => setStudentData({...studentData, subject: v})} placeholder="Örn: Matematik" />
            <Input label="Seviye" value={studentData.level} onChange={v => setStudentData({...studentData, level: v})} placeholder="Örn: 8. Sınıf" />
          </div>
          <Input label="Veli İletişim" value={studentData.parentContact} onChange={v => setStudentData({...studentData, parentContact: v})} placeholder="Telefon veya Not" />
          <Input label="Saatlik Ücret (₺)" type="number" value={studentData.hourlyRate} onChange={v => setStudentData({...studentData, hourlyRate: v})} />
        </div>
      )}

      {type === "schedule" && (
        <div className="space-y-4">
          <Select label="Öğrenci" value={lessonData.studentId} onChange={v => setLessonData({...lessonData, studentId: v})} options={students.map(s => ({ id: s.id, label: s.name }))} />
          <Input label="Tarih" type="date" value={lessonData.date} onChange={v => setLessonData({...lessonData, date: v})} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Başlangıç" type="time" value={lessonData.start} onChange={v => setLessonData({...lessonData, start: v})} />
            <Input label="Bitiş" type="time" value={lessonData.end} onChange={v => setLessonData({...lessonData, end: v})} />
          </div>
          <Input label="Ders Notu" value={lessonData.notes} onChange={v => setLessonData({...lessonData, notes: v})} placeholder="Bu ders ne işlendi?" />
          <Input label="Gelecek Ders" value={lessonData.nextPlan} onChange={v => setLessonData({...lessonData, nextPlan: v})} placeholder="Hangi konuyla devam edilecek?" />
        </div>
      )}

      {type === "homework" && (
        <div className="space-y-4">
          <Select label="Öğrenci" value={homeworkData.studentId} onChange={v => setHomeworkData({...homeworkData, studentId: v})} options={students.map(s => ({ id: s.id, label: s.name }))} />
          <Input label="Ödev Tanımı" value={homeworkData.task} onChange={v => setHomeworkData({...homeworkData, task: v})} placeholder="Örn: Sayfa 32-35 arası çözülecek" />
          <Input label="Teslim Tarihi" type="date" value={homeworkData.dueDate} onChange={v => setHomeworkData({...homeworkData, dueDate: v})} />
        </div>
      )}

      {type === "payments" && (
        <div className="space-y-4">
          <Select label="Öğrenci" value={paymentData.studentId} onChange={v => setPaymentData({...paymentData, studentId: v})} options={students.map(s => ({ id: s.id, label: s.name }))} />
          <Input label="Tutar (₺)" type="number" value={paymentData.amount} onChange={v => setPaymentData({...paymentData, amount: v})} />
          <Input label="Ders Sayısı" type="number" value={paymentData.count} onChange={v => setPaymentData({...paymentData, count: v})} />
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
            <input type="checkbox" checked={paymentData.isPaid} onChange={e => setPaymentData({...paymentData, isPaid: e.target.checked})} className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500" />
            <span className="text-sm font-bold text-gray-700">Ödeme Alındı</span>
          </div>
        </div>
      )}

      <button disabled={loading} className="w-full bg-blue-600 text-white h-16 rounded-2xl font-black shadow-lg shadow-blue-100 flex items-center justify-center gap-3 mt-8">
        {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><CheckCircle size={20} weight="fill" /><span className="uppercase tracking-widest text-xs">Kaydet</span></>}
      </button>
    </form>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600/10 transition-all outline-none"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: { id: string, label: string }[] }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{label}</label>
      <select 
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600/10 transition-all outline-none appearance-none"
      >
        <option value="">Seçiniz...</option>
        {options.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
      </select>
    </div>
  );
}
