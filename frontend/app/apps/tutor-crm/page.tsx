"use client";
import { getAppRootUrl } from "@/lib/apps";

import { useState, useEffect, useRef } from "react";
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
  X,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ShareNetwork,
  MagnifyingGlass,
  ListChecks,
  CalendarCheck
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import Client, { tutor_crm } from "@/lib/client";
import { useRouter } from "next/navigation";

const client = createBrowserClient();

type TabType = "schedule" | "students" | "homework" | "payments";
type CalendarViewType = "grid" | "list";
type CalendarSizeType = "compact" | "spacious";

export default function TutorCRMPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>("schedule"); // Schedule/Takvim is now default
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<tutor_crm.Student[]>([]);
  const [lessons, setLessons] = useState<tutor_crm.Lesson[]>([]);
  const [homeworks, setHomeworks] = useState<tutor_crm.Homework[]>([]);
  const [payments, setPayments] = useState<tutor_crm.Payment[]>([]);

  // Calendar-specific states - Compact mode as default now
  const [calendarView, setCalendarView] = useState<CalendarViewType>("grid");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [mobileDraftLesson, setMobileDraftLesson] = useState<{
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [resizingDraft, setResizingDraft] = useState<{
    edge: "top" | "bottom";
    startY: number;
    initialStart: string;
    initialEnd: string;
  } | null>(null);

  // Mouse Drag selection states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState<{ day: Date; timeSlot: string } | null>(null);
  const [dragEndSlot, setDragEndSlot] = useState<{ day: Date; timeSlot: string } | null>(null);

  // Quick Schedule popup state (with mouse position)
  const [quickScheduleData, setQuickScheduleData] = useState<{
    date: string;
    startTime: string;
    endTime: string;
    x: number;
    y: number;
  } | null>(null);

  // Quick add student state inside popover
  const [showNewStudentForm, setShowNewStudentForm] = useState(false);
  const [quickStudentName, setQuickStudentName] = useState("");
  const [quickStudentSubject, setQuickStudentSubject] = useState("");

  // Ref for the quick popup to detect click outside
  const quickPopupRef = useRef<HTMLDivElement>(null);
  const wasResizingRef = useRef(false);
  const touchStartRef = useRef<{ x: number, y: number, day: Date, timeSlot: string } | null>(null);
  const touchMovedRef = useRef<boolean>(false);
  const swipeTouchStartRef = useRef<{ x: number, y: number } | null>(null);

  // Drag and Drop lesson states
  const [draggedLesson, setDraggedLesson] = useState<tutor_crm.Lesson | null>(null);

  // Sharing & Followed Tutors states
  const [shareSettings, setShareSettings] = useState<tutor_crm.Share | null>(null);
  const [followedShares, setFollowedShares] = useState<tutor_crm.FollowedShare[]>([]);
  const [activeFollowedShareId, setActiveFollowedShareId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTab, setShareTab] = useState<"my-share" | "followed">("my-share");
  const [followInputId, setFollowInputId] = useState("");
  const [followInputAlias, setFollowInputAlias] = useState("");
  const [dragOverSlot, setDragOverSlot] = useState<{ day: Date; timeSlot: string } | null>(null);
  const [resizingLesson, setResizingLesson] = useState<{
    lesson: tutor_crm.Lesson;
    edge: "top" | "bottom";
    startY: number;
    initialStartTime: string;
    initialEndTime: string;
  } | null>(null);

  // Drawer & Form control states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<tutor_crm.Student | null>(null);
  const [studentFilterSubject, setStudentFilterSubject] = useState<string>("Tümü");
  const [newHomeworkTask, setNewHomeworkTask] = useState("");
  const [newHomeworkDueDate, setNewHomeworkDueDate] = useState("");
  const [isAssigningHomework, setIsAssigningHomework] = useState(false);
  const [quickLessonDate, setQuickLessonDate] = useState("");
  const [quickLessonStartTime, setQuickLessonStartTime] = useState("");
  const [quickLessonEndTime, setQuickLessonEndTime] = useState("");
  const [quickLessonNotes, setQuickLessonNotes] = useState("");
  const [isAddingQuickLesson, setIsAddingQuickLesson] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editStudentName, setEditStudentName] = useState("");
  const [editStudentSubject, setEditStudentSubject] = useState("");
  const [editStudentLevel, setEditStudentLevel] = useState("");
  const [editStudentHourlyRate, setEditStudentHourlyRate] = useState(0);
  const [editStudentParentContact, setEditStudentParentContact] = useState("");
  const [formPreFill, setFormPreFill] = useState<{
    date?: string;
    startTime?: string;
    endTime?: string;
  }>({});

  // Lesson Detail view modal state
  const [selectedLesson, setSelectedLesson] = useState<tutor_crm.Lesson | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (isUserLoaded) {
      fetchAllData();
    }
  }, [isUserLoaded, user, activeFollowedShareId]);

  // Click outside to dismiss quick schedule popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickPopupRef.current && !quickPopupRef.current.contains(event.target as Node)) {
        setQuickScheduleData(null);
        setShowNewStudentForm(false);
        setQuickStudentName("");
        setQuickStudentSubject("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedStudent(null);
        setSelectedLesson(null);
        setNewHomeworkTask("");
        setNewHomeworkDueDate("");
        setQuickLessonDate("");
        setQuickLessonStartTime("");
        setQuickLessonEndTime("");
        setQuickLessonNotes("");
        setIsEditingStudent(false);
        setMobileDraftLesson(null); // clear mobile draft on Escape
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Touch-based draft lesson resizing on mobile
  useEffect(() => {
    if (!resizingDraft || !mobileDraftLesson) return;

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaY = touch.clientY - resizingDraft.startY;
      const deltaSlots = Math.round(deltaY / slotHeight);
      if (deltaSlots === 0) return;

      const startIdx = timeSlots.indexOf(resizingDraft.initialStart);
      const endIdx = timeSlots.indexOf(resizingDraft.initialEnd);
      if (startIdx === -1 || endIdx === -1) return;

      if (resizingDraft.edge === "top") {
        const newStartIdx = Math.min(endIdx - 1, Math.max(0, startIdx + deltaSlots));
        const newStart = timeSlots[newStartIdx];
        setMobileDraftLesson(prev => prev ? { ...prev, startTime: newStart } : null);
        setQuickScheduleData(prev => prev ? { ...prev, startTime: newStart } : null);
      } else {
        const newEndIdx = Math.max(startIdx + 1, Math.min(timeSlots.length - 1, endIdx + deltaSlots));
        const newEnd = timeSlots[newEndIdx];
        setMobileDraftLesson(prev => prev ? { ...prev, endTime: newEnd } : null);
        setQuickScheduleData(prev => prev ? { ...prev, endTime: newEnd } : null);
      }
    };

    const handleTouchEnd = () => {
      setResizingDraft(null);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [resizingDraft, mobileDraftLesson]);

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStudent) return;
    try {
      const res = await client.tutor_crm.updateStudent({
        studentId: selectedStudent.id,
        userId: user.id,
        name: editStudentName,
        subject: editStudentSubject,
        level: editStudentLevel,
        hourlyRate: Number(editStudentHourlyRate),
        parentContact: editStudentParentContact || undefined
      });
      toast.success("Öğrenci bilgileri güncellendi");
      setIsEditingStudent(false);
      if (res.student) {
        setSelectedStudent(res.student);
      }
      fetchAllData();
    } catch (err) {
      toast.error("Güncellenirken hata oluştu");
    }
  };

  const fetchAllData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [sRes, hRes, pRes, shareSettingsRes, followedSharesRes] = await Promise.all([
        client.tutor_crm.getStudents(user.id),
        client.tutor_crm.getHomeworks(user.id),
        client.tutor_crm.getPayments(user.id),
        client.tutor_crm.getShareSettings(user.id),
        client.tutor_crm.getFollowedShares(user.id)
      ]);
      setStudents(sRes.students);
      setHomeworks(hRes.homeworks);
      setPayments(pRes.payments);
      setShareSettings(shareSettingsRes.share);
      setFollowedShares(followedSharesRes.followed);

      // Fetch lessons: either followed plan or user's own lessons
      if (activeFollowedShareId) {
        const sharedLessonsRes = await client.tutor_crm.getSharedLessons(activeFollowedShareId);
        setLessons(sharedLessonsRes.lessons);
      } else {
        const lRes = await client.tutor_crm.getLessons(user.id);
        setLessons(lRes.lessons);
      }
    } catch (error) {
      console.error("fetch error:", error);
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShare = async (isActive: boolean, allowStudentNames: boolean) => {
    if (!user) return;
    try {
      const res = await client.tutor_crm.toggleShare({
        userId: user.id,
        isActive,
        allowStudentNames
      });
      setShareSettings(res.share);
      toast.success("Paylaşım ayarları güncellendi");
    } catch (err) {
      toast.error("Ayarlar güncellenirken hata oluştu");
    }
  };

  const handleFollowPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !followInputId.trim()) return;
    try {
      await client.tutor_crm.followShare({
        userId: user.id,
        shareId: followInputId.trim(),
        alias: followInputAlias.trim() || "Takip Edilen Plan"
      });
      setFollowInputId("");
      setFollowInputAlias("");
      toast.success("Plan başarıyla takip listenize eklendi");
      fetchAllData();
    } catch (err) {
      toast.error("Takip etme başarısız oldu. Geçerli bir Paylaşım ID girdiğinizden emin olun.");
    }
  };

  const handleUnfollowPlan = async (shareId: string) => {
    if (!user) return;
    const confirmUnfollow = window.confirm("Bu planı takipten çıkarmak istediğinize emin misiniz?");
    if (!confirmUnfollow) return;
    try {
      await client.tutor_crm.unfollowShare({
        userId: user.id,
        shareId
      });
      if (activeFollowedShareId === shareId) {
        setActiveFollowedShareId(null);
      }
      toast.success("Plan takip listenizden çıkarıldı");
      fetchAllData();
    } catch (err) {
      toast.error("Takibi bırakırken hata oluştu");
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!user) return;
    const student = students.find(s => s.id === id);
    const studentName = student ? student.name : "Bu öğrenciyi";
    const confirmDelete = window.confirm(`"${studentName}" isimli öğrenciyi ve öğrenciye ait tüm ders/ödev kayıtlarını silmek istediğinize emin misiniz?`);
    if (!confirmDelete) return;
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

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (name.length >= 2) {
      return name.slice(0, 2).toUpperCase();
    }
    return name.toUpperCase();
  };

  // Helper date calculations for the grid
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(date.setDate(diff));
    mon.setHours(0, 0, 0, 0);
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

  // Drag selection handlers
  const startDragging = (day: Date, timeSlot: string) => {
    setIsDragging(true);
    setDragStartSlot({ day, timeSlot });
    setDragEndSlot({ day, timeSlot });
  };

  const updateDragging = (day: Date, timeSlot: string) => {
    if (!isDragging || !dragStartSlot) return;
    if (formatDatePickerDate(day) !== formatDatePickerDate(dragStartSlot.day)) return;
    setDragEndSlot({ day, timeSlot });
  };

  const finishDragging = (e?: MouseEvent | { clientX: number; clientY: number }) => {
    if (!isDragging || !dragStartSlot || !dragEndSlot) {
      setIsDragging(false);
      return;
    }

    setIsDragging(false);

    const startIndex = timeSlots.indexOf(dragStartSlot.timeSlot);
    const endIndex = timeSlots.indexOf(dragEndSlot.timeSlot);

    if (startIndex === -1 || endIndex === -1) return;

    const actualStartIdx = Math.min(startIndex, endIndex);
    const actualEndIdx = Math.max(startIndex, endIndex);

    const startSlot = timeSlots[actualStartIdx];

    const endSlotRaw = timeSlots[actualEndIdx];
    const [h, m] = endSlotRaw.split(":").map(Number);
    const totalEndMins = h * 60 + m + 30;
    const endH = Math.floor(totalEndMins / 60);
    const endM = totalEndMins % 60;
    const endSlot = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

    // Get cursor coordinates for floating menu alignment
    const x = e ? e.clientX : window.innerWidth / 2;
    const y = e ? e.clientY : window.innerHeight / 2;

    setQuickScheduleData({
      date: formatDatePickerDate(dragStartSlot.day),
      startTime: startSlot,
      endTime: endSlot,
      x,
      y
    });

    setDragStartSlot(null);
    setDragEndSlot(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    swipeTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!swipeTouchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - swipeTouchStartRef.current.x;
    const deltaY = touch.clientY - swipeTouchStartRef.current.y;
    swipeTouchStartRef.current = null;

    // Swipe horizontal check: distance > 60px, vertical distance < 50px
    if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 50) {
      if (deltaX > 0) {
        // Swipe Right -> previous week
        changeWeek(-1);
      } else {
        // Swipe Left -> next week
        changeWeek(1);
      }
    }
  };

  // Global mouseup event to stop dragging if mouse is released outside
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        finishDragging(e);
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDragging, dragStartSlot, dragEndSlot]);

  // Resize Lesson event handler effect
  useEffect(() => {
    if (!resizingLesson || !user) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizingLesson.startY;
      const deltaSlots = Math.round(deltaY / slotHeight);
      if (deltaSlots === 0) return;

      const startIdx = timeSlots.indexOf(resizingLesson.initialStartTime.slice(0, 5));
      const endIdx = timeSlots.indexOf(resizingLesson.initialEndTime.slice(0, 5));
      if (startIdx === -1 || endIdx === -1) return;

      let newStartIdx = startIdx;
      let newEndIdx = endIdx;

      if (resizingLesson.edge === "top") {
        newStartIdx = Math.min(endIdx - 1, Math.max(0, startIdx + deltaSlots));
      } else {
        newEndIdx = Math.max(startIdx + 1, Math.min(timeSlots.length - 1, endIdx + deltaSlots));
      }

      const newStartTime = timeSlots[newStartIdx];
      const newEndTime = timeSlots[newEndIdx];

      setLessons(prev => prev.map(l => l.id === resizingLesson.lesson.id ? {
        ...l,
        start_time: newStartTime,
        end_time: newEndTime
      } : l));
    };

    const handleMouseUp = async () => {
      const currentLesson = lessons.find(l => l.id === resizingLesson.lesson.id);

      setTimeout(() => {
        wasResizingRef.current = false;
      }, 100);

      setResizingLesson(null);

      if (currentLesson) {
        if (currentLesson.start_time !== resizingLesson.initialStartTime || currentLesson.end_time !== resizingLesson.initialEndTime) {
          try {
            await client.tutor_crm.updateLesson({
              lessonId: currentLesson.id,
              userId: user.id,
              lessonDate: currentLesson.lesson_date,
              startTime: currentLesson.start_time.slice(0, 5),
              endTime: currentLesson.end_time.slice(0, 5)
            });
            toast.success("Ders süresi güncellendi!");
          } catch (error) {
            toast.error("Ders güncellenirken hata oluştu");
            fetchAllData(); // rollback
          }
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingLesson, user, lessons]);

  // Drag and Drop lesson event handlers
  const handleLessonDragStart = (e: React.DragEvent, lesson: tutor_crm.Lesson) => {
    setDraggedLesson(lesson);
    e.dataTransfer.setData("text/plain", lesson.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleLessonDragEnd = () => {
    setDraggedLesson(null);
    setDragOverSlot(null);
  };

  const handleDragEnter = (e: React.DragEvent, day: Date, timeSlot: string) => {
    e.preventDefault();
    if (draggedLesson) {
      setDragOverSlot({ day, timeSlot });
    }
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDropLesson = async (e: React.DragEvent, day: Date, timeSlot: string) => {
    e.preventDefault();
    setDragOverSlot(null);
    if (!draggedLesson || !user) return;

    const startStr = draggedLesson.start_time.slice(0, 5);
    const endStr = draggedLesson.end_time.slice(0, 5);
    const durationSlots = getLessonDurationSlots(startStr, endStr);

    const startIndex = timeSlots.indexOf(timeSlot);
    if (startIndex === -1) return;

    // Find the end time slot by adding duration
    const [h, m] = timeSlot.split(":").map(Number);
    const totalEndMins = h * 60 + m + (durationSlots * 30);
    const endH = Math.floor(totalEndMins / 60);
    const endM = totalEndMins % 60;
    const newEndTimeStr = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

    const newDateStr = formatDatePickerDate(day);

    try {
      // Optimistically update frontend state
      setLessons(prev => prev.map(l => l.id === draggedLesson.id ? {
        ...l,
        lesson_date: newDateStr,
        start_time: timeSlot,
        end_time: newEndTimeStr
      } : l));

      await client.tutor_crm.updateLesson({
        lessonId: draggedLesson.id,
        userId: user.id,
        lessonDate: newDateStr,
        startTime: timeSlot,
        endTime: newEndTimeStr
      });

      toast.success("Ders saati güncellendi!");
    } catch (error) {
      toast.error("Ders güncellenirken hata oluştu");
      fetchAllData(); // rollback
    } finally {
      setDraggedLesson(null);
    }
  };

  // Check if a cell is highlighted during drag or quick-select popup
  const isCellSelected = (day: Date, timeSlot: string) => {
    if (isDragging && dragStartSlot && dragEndSlot) {
      if (formatDatePickerDate(day) !== formatDatePickerDate(dragStartSlot.day)) return false;
      const startIndex = timeSlots.indexOf(dragStartSlot.timeSlot);
      const endIndex = timeSlots.indexOf(dragEndSlot.timeSlot);
      const currentIndex = timeSlots.indexOf(timeSlot);
      if (startIndex === -1 || endIndex === -1 || currentIndex === -1) return false;
      const minIdx = Math.min(startIndex, endIndex);
      const maxIdx = Math.max(startIndex, endIndex);
      return currentIndex >= minIdx && currentIndex <= maxIdx;
    }

    if (quickScheduleData) {
      if (formatDatePickerDate(day) !== quickScheduleData.date) return false;
      const startIndex = timeSlots.indexOf(quickScheduleData.startTime);

      const [eH, eM] = quickScheduleData.endTime.split(":").map(Number);
      const lastSelectedMins = eH * 60 + eM - 30;
      const lastH = Math.floor(lastSelectedMins / 60);
      const lastM = lastSelectedMins % 60;
      const lastTimeStr = `${lastH.toString().padStart(2, "0")}:${lastM.toString().padStart(2, "0")}`;
      const endIndex = timeSlots.indexOf(lastTimeStr);

      const currentIndex = timeSlots.indexOf(timeSlot);
      if (startIndex === -1 || endIndex === -1 || currentIndex === -1) return false;
      return currentIndex >= startIndex && currentIndex <= endIndex;
    }

    return false;
  };

  const isDropPreviewActive = (day: Date, timeSlot: string) => {
    if (!draggedLesson || !dragOverSlot) return false;
    if (formatDatePickerDate(day) !== formatDatePickerDate(dragOverSlot.day)) return false;

    const startStr = draggedLesson.start_time.slice(0, 5);
    const endStr = draggedLesson.end_time.slice(0, 5);
    const durationSlots = getLessonDurationSlots(startStr, endStr);

    const startIdx = timeSlots.indexOf(dragOverSlot.timeSlot);
    const currentIdx = timeSlots.indexOf(timeSlot);

    if (startIdx === -1 || currentIdx === -1) return false;
    return currentIdx >= startIdx && currentIdx < startIdx + durationSlots;
  };

  const systemPromptTemplate = `Aşağıdaki ders planı metnini veya resmini analiz et ve bana SADECE aşağıdaki JSON formatında bir çıktı ver. Başka hiçbir açıklama, markdown falan ekleme, doğrudan saf JSON döndür.

JSON Şeması:
{
  "students": [
    {
      "name": "Öğrenci Adı Soyadı",
      "subject": "Ders Branşı (örn: Matematik, Türkçe, Fizik)",
      "level": "Sınıf seviyesi (örn: 8. Sınıf, LGS, 11. Sınıf)",
      "hourlyRate": 200
    }
  ],
  "lessons": [
    {
      "studentName": "Öğrenci Adı Soyadı (Yukarıdaki öğrenciler listesindeki isimle birebir aynı olmalıdır)",
      "date": "YYYY-MM-DD formatında ders tarihi (örn: 2026-06-01)",
      "startTime": "HH:MM formatında başlangıç saati (örn: 14:00)",
      "endTime": "HH:MM formatında bitiş saati (örn: 15:30)",
      "notes": "Opsiyonel ders notu veya konusu"
    }
  ]
}`;

  const copyAndOpenAI = (url: string) => {
    navigator.clipboard.writeText(systemPromptTemplate);
    toast.success("Yapay zeka yönlendirme komutu kopyalandı!");
    setTimeout(() => {
      window.open(url, "_blank");
    }, 800);
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      let cleanedText = importJson.trim();
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
      }

      const parsedData = JSON.parse(cleanedText);
      if (!parsedData.students || !parsedData.lessons) {
        toast.error("Format hatası: JSON içerisinde 'students' ve 'lessons' dizileri bulunmalıdır.");
        return;
      }

      setLoading(true);

      const studentMap = new Map<string, string>();
      const existing = await client.tutor_crm.getStudents(user.id);
      existing.students.forEach(s => {
        studentMap.set(s.name.toLowerCase().trim(), s.id);
      });

      // 1. Add students
      for (const student of parsedData.students) {
        const normName = student.name.toLowerCase().trim();
        if (!studentMap.has(normName)) {
          const res = await client.tutor_crm.addStudent({
            userId: user.id,
            name: student.name,
            subject: student.subject || "Genel",
            level: student.level || "Seviye Belirsiz",
            hourlyRate: Number(student.hourlyRate) || 200
          });
          if (res.student && res.student.id) {
            studentMap.set(normName, res.student.id);
          }
        }
      }

      // 2. Add lessons
      let addedLessonsCount = 0;
      for (const lesson of parsedData.lessons) {
        const sId = studentMap.get(lesson.studentName.toLowerCase().trim());
        if (sId) {
          await client.tutor_crm.addLesson({
            userId: user.id,
            studentId: sId,
            lessonDate: lesson.date,
            startTime: lesson.startTime,
            endTime: lesson.endTime,
            notes: lesson.notes || undefined
          });
          addedLessonsCount++;
        }
      }

      toast.success(`${parsedData.students.length} Öğrenci ve ${addedLessonsCount} Ders başarıyla aktarıldı!`);
      setIsBulkImportModalOpen(false);
      setImportJson("");
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error("JSON ayrıştırılamadı. Lütfen geçerli bir JSON yapıştırdığınızdan emin olun.");
    } finally {
      setLoading(false);
    }
  };

  const getRelativeDateString = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Bugün";
    if (diffDays === 1) return "Yarın";
    if (diffDays === -1) return "Dün";
    if (diffDays > 0) return `${diffDays} gün sonra`;
    return `${Math.abs(diffDays)} gün önce`;
  };

  const handleQuickLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStudent || !quickLessonDate || !quickLessonStartTime || !quickLessonEndTime) return;
    try {
      setIsAddingQuickLesson(true);
      await client.tutor_crm.addLesson({
        userId: user.id,
        studentId: selectedStudent.id,
        lessonDate: quickLessonDate,
        startTime: quickLessonStartTime,
        endTime: quickLessonEndTime,
        notes: quickLessonNotes || undefined
      });
      toast.success("Ders başarıyla planlandı!");
      setQuickLessonDate("");
      setQuickLessonStartTime("");
      setQuickLessonEndTime("");
      setQuickLessonNotes("");
      fetchAllData();
    } catch (err) {
      toast.error("Ders planlanırken hata oluştu");
    } finally {
      setIsAddingQuickLesson(false);
    }
  };

  const handleQuickHomeworkAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStudent || !newHomeworkTask.trim()) return;
    try {
      setIsAssigningHomework(true);
      await client.tutor_crm.addHomework({
        userId: user.id,
        studentId: selectedStudent.id,
        task: newHomeworkTask,
        dueDate: newHomeworkDueDate || undefined
      });
      toast.success("Ödev atandı!");
      setNewHomeworkTask("");
      setNewHomeworkDueDate("");
      fetchAllData();
    } catch (err) {
      toast.error("Ödev atanamadı");
    } finally {
      setIsAssigningHomework(false);
    }
  };

  const handleQuickScheduleSubmit = async (studentId: string) => {
    if (!user || !quickScheduleData) return;
    try {
      await client.tutor_crm.addLesson({
        userId: user.id,
        studentId,
        lessonDate: quickScheduleData.date,
        startTime: quickScheduleData.startTime,
        endTime: quickScheduleData.endTime
      });
      toast.success("Ders başarıyla planlandı!");
      setQuickScheduleData(null);
      fetchAllData();
    } catch (error) {
      toast.error("Hata oluştu");
    }
  };

  const handleQuickStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !quickScheduleData || !quickStudentName.trim()) return;
    try {
      // 1. Create the student first
      const studentRes = await client.tutor_crm.addStudent({
        userId: user.id,
        name: quickStudentName,
        subject: quickStudentSubject || "Genel",
        level: "Seviye Belirsiz",
        hourlyRate: 200
      });

      // 2. Schedule the lesson with new student ID
      if (studentRes.student && studentRes.student.id) {
        await client.tutor_crm.addLesson({
          userId: user.id,
          studentId: studentRes.student.id,
          lessonDate: quickScheduleData.date,
          startTime: quickScheduleData.startTime,
          endTime: quickScheduleData.endTime
        });
        toast.success("Öğrenci oluşturuldu ve ders planlandı!");
      }

      // Reset forms & close popup
      setQuickStudentName("");
      setQuickStudentSubject("");
      setShowNewStudentForm(false);
      setQuickScheduleData(null);
      fetchAllData();
    } catch (error) {
      toast.error("Hata oluştu");
    }
  };

  // Click handler for scheduling from grid cells
  const handleGridCellClick = (day: Date, timeSlot: string, e: React.MouseEvent) => {
    const dateStr = formatDatePickerDate(day);

    // Add 30 mins to calculate end time
    const [h, m] = timeSlot.split(":").map(Number);
    const totalEndMins = h * 60 + m + 30;
    const endH = Math.floor(totalEndMins / 60);
    const endM = totalEndMins % 60;
    const endTimeStr = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

    // Mobile check
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      if (mobileDraftLesson) {
        // Relocate current draft to new time/date, keeping the same duration!
        const startIdx = timeSlots.indexOf(mobileDraftLesson.startTime);
        const endIdx = timeSlots.indexOf(mobileDraftLesson.endTime);
        const durationSlots = endIdx - startIdx;
        
        const newStartIdx = timeSlots.indexOf(timeSlot);
        const newEndIdx = Math.min(timeSlots.length - 1, newStartIdx + durationSlots);
        setMobileDraftLesson({
          date: dateStr,
          startTime: timeSlot,
          endTime: timeSlots[newEndIdx]
        });
      } else {
        // Create new draft
        setMobileDraftLesson({
          date: dateStr,
          startTime: timeSlot,
          endTime: endTimeStr
        });
      }
      return;
    }

    setQuickScheduleData({
      date: dateStr,
      startTime: timeSlot,
      endTime: endTimeStr,
      x: e.clientX,
      y: e.clientY
    });
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

  // Re-ordered navigation items: calendar first
  const navItems = [
    { id: "schedule", label: "Takvim & Plan", icon: Calendar },
    { id: "students", label: "Öğrenciler", icon: Users },
    { id: "homework", label: "Ödevler", icon: BookOpen },
    { id: "payments", label: "Ödemeler", icon: CreditCard },
  ];

  const isCompact = true;
  const slotHeight = 24;

  // Calculate coordinates to clamp floating popup to window boundaries
  let popupX = 0;
  let popupY = 0;
  if (quickScheduleData) {
    const popupWidth = 240;
    const popupHeight = showNewStudentForm ? 280 : 250;
    popupX = Math.min(Math.max(16, quickScheduleData.x + 8), window.innerWidth - popupWidth - 16);
    popupY = Math.min(Math.max(16, quickScheduleData.y + 8), window.innerHeight - popupHeight - 16);
  }

  const actionButtons = activeFollowedShareId ? null : (
    <div className="flex gap-2 w-full sm:w-auto justify-stretch sm:justify-end">
      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Trigger asChild>
          <button className="flex-1 sm:flex-initial bg-gray-950 text-white px-3.5 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all shrink-0 hover:bg-gray-800">
            <Plus size={12} weight="bold" />
            <span>Ekle</span>
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
                  setMobileDraftLesson(null);
                  fetchAllData();
                }}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <button
        onClick={() => setIsBulkImportModalOpen(true)}
        className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all shrink-0"
      >
        <BookOpen size={12} weight="bold" />
        <span>Akıllı Yükle</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row pb-24 md:pb-12">
      <Toaster position="top-center" />

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-5 shrink-0 h-screen sticky top-0 justify-between shadow-sm z-30">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.location.href = getAppRootUrl()}
              className="p-1.5 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
            >
              <CaretLeft size={18} weight="bold" className="text-gray-400" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-base font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                <GraduationCap size={20} weight="fill" className="text-blue-600" />
                Tutor <span className="text-blue-600">Place</span>
              </h1>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Planner & Manager</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TabType);
                  setFormPreFill({}); // Reset pre-fill
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${activeTab === item.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                  }`}
              >
                <item.icon size={18} weight={activeTab === item.id ? "fill" : "bold"} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

      </aside>

      {/* MOBILE STICKY HEADER */}
      <header className="md:hidden sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-40 shadow-sm">
        {/* Month Selector / Month Text */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={() => window.location.href = getAppRootUrl()}
            className="p-1 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer mr-1 shrink-0"
          >
            <CaretLeft size={18} weight="bold" className="text-gray-400" />
          </button>
          <span className="text-xs font-black text-gray-900 ml-1 uppercase truncate">
            {currentWeekStart.toLocaleDateString("tr-TR", { month: "short", year: "numeric" })}
          </span>
        </div>

        {/* Right side items: Today, Search, Checklist */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Today Button */}
          <button 
            onClick={setTodayWeek}
            className="p-1.5 hover:bg-gray-50 rounded-xl transition-colors text-gray-600 cursor-pointer"
            title="Bugün"
          >
            <Calendar size={16} weight="bold" />
          </button>

          {/* Search Button */}
          <button 
            onClick={() => {
              setActiveTab("students");
              toast.success("Öğrenci arama listesi açıldı");
            }}
            className="p-1.5 hover:bg-gray-50 rounded-xl transition-colors text-gray-600 cursor-pointer"
          >
            <MagnifyingGlass size={16} weight="bold" />
          </button>

          {/* Badge Icon: Today's lessons count */}
          <button
            onClick={() => {
              setActiveTab("schedule");
              setCalendarView("list");
            }}
            className="relative p-1.5 hover:bg-gray-50 rounded-xl transition-colors text-gray-600 cursor-pointer"
          >
            <CalendarCheck size={16} weight="bold" />
            {lessons.filter(l => l.lesson_date === formatDatePickerDate(new Date())).length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
                {lessons.filter(l => l.lesson_date === formatDatePickerDate(new Date())).length}
              </span>
            )}
          </button>

          {/* Homeworks / Task Check Icon */}
          <button
            onClick={() => setActiveTab("homework")}
            className="p-1.5 hover:bg-gray-50 rounded-xl transition-colors text-gray-600 cursor-pointer"
          >
            <ListChecks size={16} weight="bold" />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className={`flex-1 ${activeTab === "schedule" ? "p-0" : "p-6"} md:p-10 max-w-7xl mx-auto w-full overflow-x-hidden`}>

        {/* Content Wrapper */}
        <div className="space-y-6 relative">
          {loading && students.length === 0 && lessons.length === 0 ? (
            <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">
              Yükleniyor...
            </div>
          ) : (
            <>
              {/* TOP CONTROL BAR (ONLY FOR TAKVIM/SCHEDULE TAB) */}
              {!loading && activeTab === "schedule" && (
                <div className="hidden md:flex flex-col lg:flex-row gap-3 items-center justify-between bg-white p-3 sm:px-5 sm:py-3 rounded-2xl border border-gray-100 w-full">
                  <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto">
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full sm:w-auto justify-center sm:justify-start">
                      {/* Plan Selector Dropdown */}
                      <div className="flex items-center bg-gray-50 border border-gray-150 rounded-xl px-2.5 py-1 shrink-0">
                        <select
                          value={activeFollowedShareId || ""}
                          onChange={(e) => setActiveFollowedShareId(e.target.value || null)}
                          className="bg-transparent border-none text-[10px] font-black text-gray-800 uppercase outline-none focus:ring-0 cursor-pointer pr-6 py-0.5"
                        >
                          <option value="">Benim Planım</option>
                          {followedShares.map(fs => (
                            <option key={fs.share_id} value={fs.share_id}>
                              {fs.alias || "Tutor"}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Vertical separator */}
                      <div className="h-5 w-px bg-gray-200 shrink-0" />

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

                  {/* Action Buttons & Share Button */}
                  <div className="flex gap-2 w-full lg:w-auto justify-stretch sm:justify-end">
                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="flex-1 sm:flex-initial bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-3.5 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all shrink-0"
                    >
                      <ShareNetwork size={12} weight="bold" />
                      <span>Paylaş</span>
                    </button>
                    {actionButtons}
                  </div>
                </div>
              )}

              {loading && (
                <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-3xl pointer-events-auto">
                  <div className="bg-white/90 border border-gray-150 shadow-2xl px-5 py-3 rounded-2xl flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Yükleniyor...</span>
                  </div>
                </div>
              )}
              <AnimatePresence mode="wait">
                {/* SCHEDULE / GRID TAB (FIRST / DEFAULT NOW) */}
                {activeTab === "schedule" && (
                  <motion.div
                    key="schedule"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Followed plan warning banner */}
                    {activeFollowedShareId && (
                      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between text-amber-800 text-xs font-semibold shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                          <span>Şu anda takip ettiğiniz <strong>{followedShares.find(f => f.share_id === activeFollowedShareId)?.alias || "Tutor"}</strong> planını görüntülüyorsunuz. (Salt Okunur)</span>
                        </div>
                        <button
                          onClick={() => setActiveFollowedShareId(null)}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all shadow-sm"
                        >
                          Kendi Planıma Dön
                        </button>
                      </div>
                    )}
                    {/* Calendar Views */}
                    {calendarView === "grid" ? (
                      /* WEEKLY HOUR GRID WITH MOUSE DRAG RANGE */
                      <div 
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        className="bg-white md:rounded-3xl md:border border-gray-100 md:shadow-sm overflow-hidden select-none h-[calc(100dvh-105px)] md:h-auto overflow-y-auto md:overflow-y-visible"
                      >
                        <div className="overflow-x-auto">
                          <table className="w-full md:min-w-[900px] min-w-0 table-fixed border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100">
                                {/* Empty corner header for times */}
                                <th className={`sticky left-0 top-0 bg-gray-50 z-40 border-r border-gray-100 ${isCompact ? "w-10 py-1.5 px-0.5 text-[8px]" : "w-20 py-4 px-3 text-[10px]"} font-black uppercase text-gray-400 text-center tracking-widest`}>
                                  Saat
                                </th>
                                {days.map((day, idx) => {
                                  const isToday = formatDatePickerDate(day) === formatDatePickerDate(new Date());
                                  const dateStr = formatDatePickerDate(day);
                                  const dayLessons = lessons.filter(l => l.lesson_date === dateStr);
                                  return (
                                    <th key={idx} className={`sticky top-0 bg-white z-30 border-b border-gray-100 border-r border-gray-100 last:border-r-0 ${isCompact ? "py-1.5 px-0.5" : "py-4 px-3"}`}>
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className={`font-black uppercase tracking-widest ${isCompact ? "text-[8px]" : "text-[10px]"
                                          } ${isToday ? "text-blue-600" : "text-gray-400"}`}>
                                          {day.toLocaleDateString("tr-TR", { weekday: isCompact ? "narrow" : "short" })}
                                        </span>
                                        <span className={`rounded-full flex items-center justify-center font-black ${isCompact ? "w-5 h-5 text-[10px]" : "w-7 h-7 text-sm"
                                          } ${isToday ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-900"
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
                              <tr className="align-top">
                                {/* Time Column - Sticky Left */}
                                <td className={`sticky left-0 bg-gray-50/90 z-20 p-0 border-r border-gray-100 ${isCompact ? "w-10" : "w-20"}`}>
                                  {timeSlots.map((timeSlot) => {
                                    const isFullHourLine = timeSlot.endsWith(":30");
                                    return (
                                      <div  
                                        key={timeSlot}
                                        style={{ height: `${slotHeight}px` }}
                                        className={`relative w-full border-b last:border-b-0 ${isFullHourLine ? "border-gray-200" : "border-gray-100"
                                          }`}
                                      >
                                        <span
                                          className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-gray-400 bg-[#F8F9FA] px-1 select-none pointer-events-none ${isCompact ? "text-[8px]" : "text-[10px]"
                                            }`}
                                        >
                                          {timeSlot === "07:30" ? "" : timeSlot}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </td>

                                {/* Day Columns */}
                                {days.map((day, dayIdx) => {
                                  const dateStr = formatDatePickerDate(day);
                                  const dayLessons = lessons.filter(l => l.lesson_date === dateStr);

                                  // Group and calculate widths for overlapping lessons
                                  const sortedLessons = [...dayLessons].sort((a, b) => a.start_time.localeCompare(b.start_time));
                                  const clusters: tutor_crm.Lesson[][] = [];
                                  sortedLessons.forEach(lesson => {
                                    let placed = false;
                                    for (const cluster of clusters) {
                                      const overlaps = cluster.some(cLesson => {
                                        const lStart = lesson.start_time.slice(0, 5);
                                        const lEnd = lesson.end_time.slice(0, 5);
                                        const cStart = cLesson.start_time.slice(0, 5);
                                        const cEnd = cLesson.end_time.slice(0, 5);
                                        return lStart < cEnd && lEnd > cStart;
                                      });
                                      if (overlaps) {
                                        cluster.push(lesson);
                                        placed = true;
                                        break;
                                      }
                                    }
                                    if (!placed) {
                                      clusters.push([lesson]);
                                    }
                                  });

                                  const lessonPositions = new Map<string, { width: number; left: number }>();
                                  clusters.forEach(cluster => {
                                    const columns: tutor_crm.Lesson[][] = [];
                                    cluster.forEach(lesson => {
                                      let colIndex = 0;
                                      while (true) {
                                        if (!columns[colIndex]) {
                                          columns[colIndex] = [lesson];
                                          break;
                                        }
                                        const lastLessonInCol = columns[colIndex][columns[colIndex].length - 1];
                                        const lStart = lesson.start_time.slice(0, 5);
                                        const lastEnd = lastLessonInCol.end_time.slice(0, 5);
                                        if (lStart >= lastEnd) {
                                          columns[colIndex].push(lesson);
                                          break;
                                        }
                                        colIndex++;
                                      }
                                    });
                                    const totalCols = columns.length;
                                    columns.forEach((col, colIdx) => {
                                      col.forEach(lesson => {
                                        lessonPositions.set(lesson.id, {
                                          width: 100 / totalCols,
                                          left: (colIdx * 100) / totalCols
                                        });
                                      });
                                    });
                                  });

                                  return (
                                    <td
                                      key={dayIdx}
                                      className="p-0 border-r border-gray-100 last:border-r-0 relative align-top"
                                      style={{ height: `${timeSlots.length * slotHeight}px` }}
                                    >
                                      {/* Grid slots background */}
                                      <div className="absolute inset-0 flex flex-col pointer-events-auto">
                                        {timeSlots.map((timeSlot) => {
                                          const isSelected = isCellSelected(day, timeSlot);
                                          const isDropPreview = isDropPreviewActive(day, timeSlot);

                                          let dropPreviewClasses = "";
                                          let isFirst = false;
                                          let isLast = false;
                                          let dragPreviewEndTime = "";

                                          if (isDropPreview && draggedLesson && dragOverSlot) {
                                            const startStr = draggedLesson.start_time.slice(0, 5);
                                            const endStr = draggedLesson.end_time.slice(0, 5);
                                            const durationSlots = getLessonDurationSlots(startStr, endStr);
                                            const startIdx = timeSlots.indexOf(dragOverSlot.timeSlot);
                                            const currentIdx = timeSlots.indexOf(timeSlot);
                                            isFirst = currentIdx === startIdx;
                                            isLast = currentIdx === startIdx + durationSlots - 1;

                                            // Calculate preview end time
                                            const [h, m] = dragOverSlot.timeSlot.split(":").map(Number);
                                            const totalEndMins = h * 60 + m + (durationSlots * 30);
                                            const endH = Math.floor(totalEndMins / 60);
                                            const endM = totalEndMins % 60;
                                            dragPreviewEndTime = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

                                            dropPreviewClasses = "bg-blue-100/70 border-x-2 border-dashed border-blue-500 z-20";
                                            if (isFirst) dropPreviewClasses += " border-t-2";
                                            if (isLast) dropPreviewClasses += " border-b-2";
                                          }

                                          const isFullHourLine = timeSlot.endsWith(":30");

                                          return (
                                            <div
                                              key={timeSlot}
                                              data-date={dateStr}
                                              data-time={timeSlot}
                                              onMouseDown={(e) => {
                                                if (activeFollowedShareId) return;
                                                if (e.button === 0) {
                                                  e.preventDefault();
                                                  startDragging(day, timeSlot);
                                                }
                                              }}
                                              onMouseEnter={() => {
                                                if (activeFollowedShareId) return;
                                                updateDragging(day, timeSlot);
                                              }}
                                              onTouchStart={(e) => {
                                                if (activeFollowedShareId) return;
                                                const touch = e.touches[0];
                                                touchStartRef.current = { x: touch.clientX, y: touch.clientY, day, timeSlot };
                                                touchMovedRef.current = false;
                                              }}
                                              onTouchMove={(e) => {
                                                if (activeFollowedShareId) return;
                                                if (!touchStartRef.current) return;
                                                const touch = e.touches[0];
                                                const diffX = Math.abs(touch.clientX - touchStartRef.current.x);
                                                const diffY = Math.abs(touch.clientY - touchStartRef.current.y);
                                                if (diffY > 8 && diffY > diffX) {
                                                  if (!touchMovedRef.current) {
                                                    touchMovedRef.current = true;
                                                    startDragging(touchStartRef.current.day, touchStartRef.current.timeSlot);
                                                  }
                                                  const target = document.elementFromPoint(touch.clientX, touch.clientY);
                                                  if (target) {
                                                    const cell = target.closest('[data-date][data-time]');
                                                    if (cell) {
                                                      const dStr = cell.getAttribute('data-date');
                                                      const tSlot = cell.getAttribute('data-time');
                                                      if (dStr && tSlot) {
                                                        const matchedDay = days.find(d => formatDatePickerDate(d) === dStr);
                                                        if (matchedDay) {
                                                          updateDragging(matchedDay, tSlot);
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }}
                                              onTouchEnd={(e) => {
                                                if (activeFollowedShareId) return;
                                                if (!touchStartRef.current) return;
                                                e.preventDefault();
                                                const touch = e.changedTouches[0];
                                                if (!touchMovedRef.current) {
                                                  handleGridCellClick(touchStartRef.current.day, touchStartRef.current.timeSlot, { clientX: touch.clientX, clientY: touch.clientY } as any);
                                                } else {
                                                  finishDragging({ clientX: touch.clientX, clientY: touch.clientY });
                                                }
                                                touchStartRef.current = null;
                                                touchMovedRef.current = false;
                                              }}
                                              onClick={(e) => {
                                                if (activeFollowedShareId) return;
                                                handleGridCellClick(day, timeSlot, e);
                                              }}
                                              onDragOver={(e) => e.preventDefault()}
                                              onDragEnter={(e) => {
                                                if (activeFollowedShareId) return;
                                                handleDragEnter(e, day, timeSlot);
                                              }}
                                              onDrop={(e) => {
                                                if (activeFollowedShareId) return;
                                                handleDropLesson(e, day, timeSlot);
                                              }}
                                              style={{ height: `${slotHeight}px` }}
                                              className={`border-b last:border-b-0 cursor-pointer relative group transition-all flex-shrink-0 touch-none select-none ${isFullHourLine ? "border-gray-200" : "border-gray-100"
                                                } ${isDropPreview
                                                  ? dropPreviewClasses
                                                  : isSelected
                                                    ? "bg-blue-100 border border-blue-600/30 shadow-inner z-10"
                                                    : resizingLesson
                                                      ? ""
                                                      : "hover:bg-blue-50/40"
                                                }`}
                                            >
                                              {isDropPreview && draggedLesson && dragOverSlot && (
                                                <>
                                                  {isFirst && (
                                                    <span className="absolute left-1 top-0.5 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded pointer-events-none z-30 select-none shadow-sm leading-none">
                                                      {dragOverSlot.timeSlot}
                                                    </span>
                                                  )}
                                                  {isLast && (
                                                    <span className="absolute right-1 bottom-0.5 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded pointer-events-none z-30 select-none shadow-sm leading-none">
                                                      {dragPreviewEndTime}
                                                    </span>
                                                  )}
                                                </>
                                              )}
                                              <span className="absolute inset-0 flex items-center justify-center text-blue-600/0 group-hover:text-blue-600/70 font-black text-lg transition-all">
                                                <Plus size={isCompact ? 12 : 16} weight="bold" />
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Lessons Cards Overlay */}
                                      <div className="absolute inset-0 pointer-events-none">
                                        {mobileDraftLesson && mobileDraftLesson.date === dateStr && (() => {
                                          const startStr = mobileDraftLesson.startTime;
                                          const endStr = mobileDraftLesson.endTime;
                                          const startIdx = timeSlots.indexOf(startStr);
                                          if (startIdx === -1) return null;
                                          const durationSlots = getLessonDurationSlots(startStr, endStr);
                                          return (
                                            <div
                                              style={{
                                                top: `${startIdx * slotHeight}px`,
                                                height: `${durationSlots * slotHeight}px`,
                                                left: 0,
                                                width: "100%",
                                              }}
                                              className="absolute p-0.5 pointer-events-auto z-30"
                                            >
                                              <div 
                                                onClick={() => {
                                                  setFormPreFill({
                                                    date: mobileDraftLesson.date,
                                                    startTime: mobileDraftLesson.startTime,
                                                    endTime: mobileDraftLesson.endTime
                                                  });
                                                  setIsDrawerOpen(true);
                                                }}
                                                className="h-full relative bg-blue-600/10 border-2 border-dashed border-blue-600 rounded text-left flex flex-col justify-between overflow-visible p-1"
                                              >
                                                {/* Top drag handle dot */}
                                                <div 
                                                  onTouchStart={(e) => {
                                                    e.stopPropagation();
                                                    const touch = e.touches[0];
                                                    setResizingDraft({
                                                      edge: "top",
                                                      startY: touch.clientY,
                                                      initialStart: startStr,
                                                      initialEnd: endStr
                                                    });
                                                  }}
                                                  className="absolute -top-1.5 left-2 w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white shadow-md z-40 cursor-ns-resize"
                                                />
                                                
                                                {/* Content removed as per user request */}

                                                {/* Bottom drag handle dot */}
                                                <div 
                                                  onTouchStart={(e) => {
                                                    e.stopPropagation();
                                                    const touch = e.touches[0];
                                                    setResizingDraft({
                                                      edge: "bottom",
                                                      startY: touch.clientY,
                                                      initialStart: startStr,
                                                      initialEnd: endStr
                                                    });
                                                  }}
                                                  className="absolute -bottom-1.5 right-2 w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white shadow-md z-40 cursor-ns-resize"
                                                />
                                              </div>
                                            </div>
                                          );
                                        })()}
                                        {sortedLessons.map((lesson) => {
                                          const startStr = lesson.start_time.slice(0, 5);
                                          const endStr = lesson.end_time.slice(0, 5);
                                          const startIdx = timeSlots.indexOf(startStr);
                                          if (startIdx === -1) return null;
                                          const durationSlots = getLessonDurationSlots(startStr, endStr);
                                          const pos = lessonPositions.get(lesson.id) || { width: 100, left: 0 };
                                          const isBeingDragged = draggedLesson?.id === lesson.id;

                                          return (
                                            <div
                                              key={lesson.id}
                                              style={{
                                                top: `${startIdx * slotHeight}px`,
                                                height: `${durationSlots * slotHeight}px`,
                                                left: `${pos.left}%`,
                                                width: `${pos.width}%`,
                                              }}
                                              className={`absolute p-0.5 pointer-events-auto ${resizingLesson?.lesson.id === lesson.id ? '' : 'transition-all'} ${isBeingDragged ? "opacity-40 scale-95" : ""
                                                }`}
                                            >
                                              <div
                                                onClick={() => {
                                                  if (activeFollowedShareId) return;
                                                  if (wasResizingRef.current) return;
                                                  setSelectedLesson(lesson);
                                                }}
                                                draggable={!activeFollowedShareId}
                                                onDragStart={(e) => {
                                                  if (activeFollowedShareId) return;
                                                  handleLessonDragStart(e, lesson);
                                                }}
                                                onDragEnd={handleLessonDragEnd}
                                                className={`h-full relative group bg-blue-50 md:border-l-[3px] border-l-0 border-blue-600 rounded text-left transition-all flex flex-col justify-center overflow-hidden p-1 ${activeFollowedShareId
                                                    ? "cursor-default"
                                                    : "hover:bg-blue-100/80 cursor-grab active:cursor-grabbing hover:shadow-sm"
                                                  }`}
                                              >
                                                {/* Top Resize Handle (Invisible, cursor only) */}
                                                {!activeFollowedShareId && (
                                                  <div
                                                    onMouseDown={(e) => {
                                                      e.stopPropagation();
                                                      e.preventDefault();
                                                      wasResizingRef.current = true;
                                                      setResizingLesson({
                                                        lesson,
                                                        edge: "top",
                                                        startY: e.clientY,
                                                        initialStartTime: lesson.start_time,
                                                        initialEndTime: lesson.end_time,
                                                      });
                                                    }}
                                                    className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-20"
                                                  />
                                                )}

                                                <div className="min-w-0 py-1">
                                                  {durationSlots === 1 ? (
                                                    <p className="font-bold text-gray-955 leading-tight text-[9px] flex flex-col items-center justify-center gap-0.5 w-full">
                                                      <span className="break-words whitespace-normal text-center w-full">{lesson.student_name}</span>
                                                      <span className="hidden md:inline text-blue-600 shrink-0 font-extrabold text-[8px]">{startStr}</span>
                                                    </p>
                                                  ) : (
                                                    <>
                                                      <p className="font-black text-gray-955 leading-tight break-words whitespace-normal text-[10px] mb-0.5">
                                                        {lesson.student_name}
                                                      </p>
                                                      <p className="hidden md:block font-bold text-blue-600 uppercase tracking-wide leading-none text-[8px]">
                                                        {startStr} - {endStr}
                                                      </p>
                                                    </>
                                                  )}
                                                </div>
                                                {lesson.notes && durationSlots > 2 && (
                                                  <p className="text-[8px] text-gray-500 font-medium mt-0.5 truncate max-w-full leading-none">
                                                    {lesson.notes}
                                                  </p>
                                                )}

                                                {/* Bottom Resize Handle (Invisible, cursor only) */}
                                                {!activeFollowedShareId && (
                                                  <div
                                                    onMouseDown={(e) => {
                                                      e.stopPropagation();
                                                      e.preventDefault();
                                                      wasResizingRef.current = true;
                                                      setResizingLesson({
                                                        lesson,
                                                        edge: "bottom",
                                                        startY: e.clientY,
                                                        initialStartTime: lesson.start_time,
                                                        initialEndTime: lesson.end_time,
                                                      });
                                                    }}
                                                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-20"
                                                  />
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
                      /* LIST VIEW */
                      <div className="space-y-4 w-full">
                        {lessons.length === 0 ? (
                          <EmptyState icon={Calendar} title="Ders Bulunamadı" description="Henüz planlanmış bir dersiniz yok." />
                        ) : (
                          lessons.map(lesson => (
                            <div key={lesson.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                  <Clock size={24} weight="bold" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {new Date(lesson.lesson_date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                  </p>
                                  <h3 className="font-black text-gray-955 text-lg mt-0.5">{lesson.student_name}</h3>
                                  <p className="font-bold text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                                    <Clock size={16} /> {lesson.start_time.slice(0, 5)} - {lesson.end_time.slice(0, 5)}
                                  </p>
                                  {lesson.notes && <p className="text-sm text-gray-400 mt-2 italic">"{lesson.notes}"</p>}
                                </div>
                              </div>

                              <div className="flex items-center gap-4 self-stretch sm:self-center justify-between sm:justify-end">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${lesson.status === 'completed' ? 'bg-green-50 text-green-600' :
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

                {/* STUDENTS TAB */}
                {activeTab === "students" && (
                  <motion.div
                    key="students"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6 max-w-5xl"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Öğrencileriniz</h2>
                      {actionButtons}
                    </div>

                    {students.length === 0 ? (
                      <EmptyState icon={Users} title="Öğrenci Bulunamadı" description="İlk öğrencinizi ekleyerek başlayın." />
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(
                          students.reduce((acc, student) => {
                            const key = student.subject ? student.subject.trim() : "Diğer";
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(student);
                            return acc;
                          }, {} as Record<string, tutor_crm.Student[]>)
                        ).map(([subj, list]) => (
                          <div key={subj} className="space-y-3">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                              <span className="w-1.5 h-3 bg-blue-600 rounded-full" />
                              <span>{subj}</span>
                              <span className="text-[10px] text-gray-300 font-bold">({list.length})</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {list.map(student => (
                                <div
                                  key={student.id}
                                  onClick={() => setSelectedStudent(student)}
                                  className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs shrink-0">
                                      {getInitials(student.name)}
                                    </div>
                                    <div className="min-w-0">
                                      <h3 className="font-black text-gray-905 text-sm group-hover:text-blue-600 transition-colors truncate">{student.name}</h3>
                                      <p className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider mt-0.5">{student.subject}</p>
                                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{student.level}</p>
                                    </div>
                                  </div>

                                  <div className="border-t border-gray-100 pt-2.5 mt-3 flex items-center justify-between">
                                    <div>
                                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Saatlik Ücret</span>
                                      <span className="font-black text-gray-950 text-sm">{student.hourly_rate}₺</span>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteStudent(student.id);
                                      }}
                                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                      <Trash size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
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
                    className="space-y-4 w-full"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Ödev Takibi</h2>
                      {actionButtons}
                    </div>
                    {homeworks.length === 0 ? (
                      <EmptyState icon={BookOpen} title="Ödev Bulunamadı" description="Öğrencilerinize ödev atayarak takibini yapın." />
                    ) : (
                      homeworks.map(hw => (
                        <div key={hw.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleToggleHomework(hw.id)}
                              className={`w-8 h-8 rounded-2xl border-2 flex items-center justify-center transition-all ${hw.is_completed ? "bg-green-500 border-green-500 text-white" : "border-gray-200 text-transparent hover:border-gray-300"
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
                    className="space-y-4 w-full"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Ödemeler ve Kazançlar</h2>
                      {actionButtons}
                    </div>
                    {payments.length === 0 ? (
                      <EmptyState icon={CreditCard} title="Ödeme Bulunamadı" description="Ödemeleri takip ederek kazancınızı yönetin." />
                    ) : (
                      payments.map(payment => (
                        <div key={payment.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
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
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${payment.is_paid ? "bg-green-500 text-white shadow-md shadow-green-150" : "bg-gray-100 text-gray-400 hover:bg-gray-250"
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
            </>
          )}
        </div>
      </main>

      {/* FLOATING QUICK STUDENT SELECTION POPUP (WHATSAPP EMOJI-LIKE STYLE) */}
      <AnimatePresence>
        {quickScheduleData && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            {/* Clickable page screen overlay to cancel (no blocking backdrop background style) */}
            <div className="absolute inset-0 pointer-events-auto bg-transparent" onClick={() => {
              setQuickScheduleData(null);
              setShowNewStudentForm(false);
              setQuickStudentName("");
              setQuickStudentSubject("");
            }} />

            <motion.div
              ref={quickPopupRef}
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              style={{ left: popupX, top: popupY }}
              className="absolute bg-white/95 backdrop-blur-md rounded-2xl p-4 w-[240px] shadow-2xl border border-gray-150 z-50 pointer-events-auto flex flex-col gap-3"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                  {quickScheduleData.startTime} - {quickScheduleData.endTime}
                </span>
                <button
                  onClick={() => {
                    setQuickScheduleData(null);
                    setShowNewStudentForm(false);
                    setQuickStudentName("");
                    setQuickStudentSubject("");
                  }}
                  className="p-1 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={12} weight="bold" />
                </button>
              </div>

              {!showNewStudentForm ? (
                /* STUDENT SELECTION LIST */
                <div className="flex flex-col gap-2">
                  <div className="space-y-1">
                    {students.length === 0 ? (
                      <p className="text-[10px] font-bold text-gray-450 p-3 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        Kayıtlı öğrenci yok.
                      </p>
                    ) : (
                      <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {students.map(student => (
                          <button
                            key={student.id}
                            onClick={() => handleQuickScheduleSubmit(student.id)}
                            className="w-full text-left bg-gray-50 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-xl border border-gray-100 flex items-center justify-between font-black text-xs text-gray-800 transition-all group"
                          >
                            <span className="truncate max-w-[130px]">{student.name}</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-blue-200 shrink-0">
                              {student.subject.slice(0, 4)}..
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Create New Student Trigger */}
                  <button
                    onClick={() => setShowNewStudentForm(true)}
                    className="w-full py-2 border border-dashed border-blue-200 rounded-xl text-[10px] font-black text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-1 mt-1"
                  >
                    <Plus size={10} weight="bold" />
                    <span>Yeni Öğrenci Ekle & Planla</span>
                  </button>
                </div>
              ) : (
                /* INLINE NEW STUDENT FORM */
                <form onSubmit={handleQuickStudentSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-wider pl-1">Öğrenci Adı</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Mehmet Can"
                      value={quickStudentName}
                      onChange={e => setQuickStudentName(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-1 focus:ring-blue-600/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-wider pl-1">Ders / Branş</label>
                    <input
                      type="text"
                      placeholder="Örn: Matematik"
                      value={quickStudentSubject}
                      onChange={e => setQuickStudentSubject(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-1 focus:ring-blue-600/20"
                    />
                  </div>
                  <div className="flex gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewStudentForm(false);
                        setQuickStudentName("");
                        setQuickStudentSubject("");
                      }}
                      className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-[10px] font-black text-gray-600 uppercase tracking-widest transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-colors"
                    >
                      Kaydet
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHARE SETTINGS MODAL */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative border border-gray-100 flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <X size={20} weight="bold" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <ShareNetwork size={24} weight="bold" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Plan Paylaşım Ayarları</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Planınızı Paylaşın ve Başkalarının Planlarını Takip Edin</p>
                </div>
              </div>

              {/* Share settings tabs */}
              <div className="flex bg-gray-100 p-1 rounded-xl mb-6 border border-gray-200/50">
                <button
                  type="button"
                  onClick={() => setShareTab("my-share")}
                  className={`flex-1 text-center py-2 rounded-lg text-xs font-black uppercase transition-all ${shareTab === "my-share" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  Benim Paylaşımım
                </button>
                <button
                  type="button"
                  onClick={() => setShareTab("followed")}
                  className={`flex-1 text-center py-2 rounded-lg text-xs font-black uppercase transition-all ${shareTab === "followed" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  Takip Ettiklerim
                </button>
              </div>

              {shareTab === "my-share" ? (
                <div className="space-y-6">
                  {/* Share config toggle */}
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Planımı Paylaş</h4>
                        <p className="text-[10px] text-gray-500 font-medium mt-0.5">Planınızı dışarıya açık, salt okunur bir link ile paylaşır.</p>
                      </div>
                      <button
                        onClick={() => handleToggleShare(!shareSettings?.is_active, shareSettings?.allow_student_names || false)}
                        className={`w-12 h-6 rounded-full p-1 transition-all ${shareSettings?.is_active ? "bg-blue-600 flex justify-end" : "bg-gray-300 flex justify-start"
                          }`}
                      >
                        <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200/60 pt-4">
                      <div>
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Öğrenci İsimlerini Göster</h4>
                        <p className="text-[10px] text-gray-500 font-medium mt-0.5">Dışarıya açık planınızda öğrencilerin gerçek isimleri gösterilsin mi? (Kapalıyken "Ders" olarak maskelenir).</p>
                      </div>
                      <button
                        disabled={!shareSettings?.is_active}
                        onClick={() => handleToggleShare(shareSettings?.is_active || false, !shareSettings?.allow_student_names)}
                        className={`w-12 h-6 rounded-full p-1 transition-all ${!shareSettings?.is_active ? "opacity-50 cursor-not-allowed" : ""
                          } ${shareSettings?.allow_student_names ? "bg-blue-600 flex justify-end" : "bg-gray-300 flex justify-start"
                          }`}
                      >
                        <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
                      </button>
                    </div>
                  </div>

                  {shareSettings?.is_active && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Paylaşım Bağlantınız</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/apps/tutor-crm/shared/${shareSettings.id}`}
                          className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-3 text-xs font-mono text-gray-900 focus:ring-0 outline-none"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/apps/tutor-crm/shared/${shareSettings.id}`);
                            toast.success("Paylaşım linki kopyalandı!");
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors"
                        >
                          Kopyala
                        </button>
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider pl-1 mt-1">
                        Bu linki alan herkes planınızı haftalık takvim şeklinde salt okunur olarak görüntüleyebilir.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Follow plan inline form */}
                  <form onSubmit={handleFollowPlan} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Yeni Plan Takip Et</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase">Paylaşım ID (UUID)</label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: 9b1deb4d-3b7d-4bad-9bdd-..."
                          value={followInputId}
                          onChange={e => setFollowInputId(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase">Takip İsmi / Takma Ad</label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: Ahmet Hoca Matematik"
                          value={followInputAlias}
                          onChange={e => setFollowInputAlias(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Planı Takip Et
                    </button>
                  </form>

                  {/* Follow list */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-gray-850 uppercase tracking-wider pl-1">Takip Ettiğiniz Planlar</h4>
                    {followedShares.length === 0 ? (
                      <p className="text-xs text-gray-400 font-bold p-4 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        Henüz takip ettiğiniz bir plan bulunmuyor.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                        {followedShares.map(fs => (
                          <div key={fs.share_id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between hover:shadow-sm transition-all">
                            <div>
                              <h5 className="font-black text-sm text-gray-900">{fs.alias || "Tutor"}</h5>
                              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider font-mono mt-0.5">{fs.share_id}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setActiveFollowedShareId(fs.share_id);
                                  setIsShareModalOpen(false);
                                  toast.success(`${fs.alias} planı seçildi`);
                                }}
                                className="px-3.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-blue-100 transition-colors"
                              >
                                Görüntüle
                              </button>
                              <button
                                onClick={() => handleUnfollowPlan(fs.share_id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Old floating toolbar removed - now rendered statically at top of main wrapper */}

      {/* BULK IMPORT MODAL */}
      <AnimatePresence>
        {isBulkImportModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative border border-gray-100 flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => {
                  setIsBulkImportModalOpen(false);
                  setImportJson("");
                }}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <X size={20} weight="bold" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <BookOpen size={24} weight="bold" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Yapay Zekayla Toplu Yükle</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Plan Görselinizi veya Metnini Hızlıca İçe Aktarın</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Yönerge */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">💡 Nasıl Yapılır?</h4>
                  <ol className="text-xs text-gray-600 space-y-2 list-decimal pl-4 font-medium leading-relaxed">
                    <li>Aşağıdaki yönlendirme komutunu (Prompt) kopyalayın.</li>
                    <li>Gemini, Claude veya ChatGPT gibi dilediğiniz bir yapay zekaya gidin.</li>
                    <li>Kopyaladığınız komutu yapıştırın ve yanına ders planınızın <strong>fotoğrafını (resmini)</strong> veya <strong>metnini</strong> ekleyerek gönderin.</li>
                    <li>Yapay zekanın size verdiği JSON formatındaki çıktıyı kopyalayıp aşağıdaki alana yapıştırın.</li>
                  </ol>
                </div>

                {/* Prompt Kopyalama ve Yönlendirme */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">1. Adım: Yönlendirme Komutunu Kopyalayın & AI uygulamasını açın</label>
                  <div className="bg-gray-900 text-gray-300 p-4 rounded-2xl text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto border border-gray-800">
                    {systemPromptTemplate}
                  </div>

                  {/* AI Quick Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => copyAndOpenAI("https://gemini.google.com")}
                      className="bg-gray-50 hover:bg-gray-100 border border-gray-200 py-3 px-2 rounded-xl text-[9px] font-black uppercase text-gray-700 tracking-wider transition-colors text-center"
                    >
                      Kopyala ve Gemini Aç 🚀
                    </button>
                    <button
                      type="button"
                      onClick={() => copyAndOpenAI("https://claude.ai")}
                      className="bg-gray-50 hover:bg-gray-100 border border-gray-200 py-3 px-2 rounded-xl text-[9px] font-black uppercase text-gray-700 tracking-wider transition-colors text-center"
                    >
                      Kopyala ve Claude Aç 🧠
                    </button>
                    <button
                      type="button"
                      onClick={() => copyAndOpenAI("https://chatgpt.com")}
                      className="bg-gray-50 hover:bg-gray-100 border border-gray-200 py-3 px-2 rounded-xl text-[9px] font-black uppercase text-gray-700 tracking-wider transition-colors text-center"
                    >
                      Kopyala ve ChatGPT Aç 💬
                    </button>
                  </div>
                </div>

                {/* Paste Area */}
                <form onSubmit={handleBulkImport} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">2. Adım: Yapay Zekadan Gelen JSON çıktısını buraya yapıştırın</label>
                    <textarea
                      required
                      rows={6}
                      value={importJson}
                      onChange={e => setImportJson(e.target.value)}
                      placeholder='{ "students": [...], "lessons": [...] } şeklinde yapıştırın'
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-xs font-mono text-gray-900 focus:ring-2 focus:ring-blue-600/10 transition-all outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsBulkImportModalOpen(false);
                        setImportJson("");
                      }}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      İçe Aktar / Yükle
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED STUDENT INFO DIALOG/MODAL */}
      <AnimatePresence>
        {selectedStudent && (
          <div
            onClick={() => {
              setSelectedStudent(null);
              setNewHomeworkTask("");
              setNewHomeworkDueDate("");
              setQuickLessonDate("");
              setQuickLessonStartTime("");
              setQuickLessonEndTime("");
              setQuickLessonNotes("");
              setIsEditingStudent(false);
            }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setNewHomeworkTask("");
                  setNewHomeworkDueDate("");
                  setQuickLessonDate("");
                  setQuickLessonStartTime("");
                  setQuickLessonEndTime("");
                  setQuickLessonNotes("");
                  setIsEditingStudent(false);
                }}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <X size={20} weight="bold" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm shrink-0">
                  {getInitials(selectedStudent.name)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{selectedStudent.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{selectedStudent.subject} • {selectedStudent.level}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side: Student Info & Timeline */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Öğrenci Bilgileri</span>
                      <button
                        onClick={() => {
                          if (isEditingStudent) {
                            setIsEditingStudent(false);
                          } else {
                            setEditStudentName(selectedStudent.name);
                            setEditStudentSubject(selectedStudent.subject);
                            setEditStudentLevel(selectedStudent.level);
                            setEditStudentHourlyRate(selectedStudent.hourly_rate);
                            setEditStudentParentContact(selectedStudent.parent_contact || "");
                            setIsEditingStudent(true);
                          }
                        }}
                        className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase"
                      >
                        {isEditingStudent ? "İptal" : "Düzenle"}
                      </button>
                    </div>

                    {isEditingStudent ? (
                      <form onSubmit={handleUpdateStudent} className="space-y-3 pt-1">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase">Öğrenci Adı</label>
                            <input
                              type="text"
                              required
                              value={editStudentName}
                              onChange={e => setEditStudentName(e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-900 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase">Ders Branşı</label>
                            <input
                              type="text"
                              required
                              value={editStudentSubject}
                              onChange={e => setEditStudentSubject(e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-900 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase">Sınıf / Seviye</label>
                            <input
                              type="text"
                              required
                              value={editStudentLevel}
                              onChange={e => setEditStudentLevel(e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-900 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase">Saatlik Ücret (₺)</label>
                            <input
                              type="number"
                              required
                              value={editStudentHourlyRate}
                              onChange={e => setEditStudentHourlyRate(Number(e.target.value))}
                              className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-900 outline-none"
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase">Veli İletişim Bilgisi</label>
                            <input
                              type="text"
                              value={editStudentParentContact}
                              onChange={e => setEditStudentParentContact(e.target.value)}
                              placeholder="Telefon veya E-posta"
                              className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-900 outline-none"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors"
                        >
                          Değişiklikleri Kaydet
                        </button>
                      </form>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400 block">Saatlik Ücret</span>
                          <span className="font-black text-gray-900">{selectedStudent.hourly_rate}₺</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-bold">Veli İletişim</span>
                          <span className="font-bold text-gray-700 truncate block max-w-full">{selectedStudent.parent_contact || "Belirtilmemiş"}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider pl-1 block">Planlanmış Ders Geçmişi & Gelecek Planı</span>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                      {lessons.filter(l => l.student_id === selectedStudent.id).length === 0 ? (
                        <p className="text-[10px] font-bold text-gray-450 p-3 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          Henüz planlanmış ders bulunmamaktadır.
                        </p>
                      ) : (
                        lessons
                          .filter(l => l.student_id === selectedStudent.id)
                          .sort((a, b) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const dateA = new Date(a.lesson_date);
                            dateA.setHours(0, 0, 0, 0);
                            const dateB = new Date(b.lesson_date);
                            dateB.setHours(0, 0, 0, 0);

                            const diffA = Math.abs(dateA.getTime() - today.getTime());
                            const diffB = Math.abs(dateB.getTime() - today.getTime());
                            return diffA - diffB;
                          })
                          .map(l => {
                            const relStr = getRelativeDateString(l.lesson_date);
                            return (
                              <div key={l.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="font-black text-gray-900">
                                      {new Date(l.lesson_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                                    </p>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-extrabold ${relStr === "Bugün"
                                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                        : relStr.includes("sonra") || relStr === "Yarın"
                                          ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                          : "bg-gray-100 text-gray-500 border border-gray-200"
                                      }`}>
                                      {relStr}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-blue-600 font-extrabold mt-0.5">
                                    {l.start_time.slice(0, 5)} - {l.end_time.slice(0, 5)}
                                  </p>
                                </div>
                                {l.notes && (
                                  <p className="text-[10px] text-gray-500 font-medium italic max-w-[120px] truncate" title={l.notes}>
                                    "{l.notes}"
                                  </p>
                                )}
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Action Panel (Quick Lesson & Homework) */}
                <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100 space-y-6 overflow-y-auto max-h-[55vh] custom-scrollbar">
                  {/* Quick Lesson Form */}
                  <div className="space-y-3 pb-6 border-b border-gray-200/60">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-blue-600" />
                      <span className="text-[10px] font-black text-gray-900 uppercase tracking-wider block">Hızlı Ders Planla</span>
                    </div>

                    <form onSubmit={handleQuickLessonSubmit} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-wider pl-1">Ders Tarihi</label>
                        <input
                          type="date"
                          required
                          value={quickLessonDate}
                          onChange={e => setQuickLessonDate(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-1 focus:ring-blue-600/20"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-wider pl-1">Başlangıç</label>
                          <input
                            type="time"
                            required
                            value={quickLessonStartTime}
                            onChange={e => setQuickLessonStartTime(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-1 focus:ring-blue-600/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-wider pl-1">Bitiş</label>
                          <input
                            type="time"
                            required
                            value={quickLessonEndTime}
                            onChange={e => setQuickLessonEndTime(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-1 focus:ring-blue-600/20"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-wider pl-1">Ders Notu / Konu (Opsiyonel)</label>
                        <input
                          type="text"
                          placeholder="Örn: Newton yasaları soru çözümü"
                          value={quickLessonNotes}
                          onChange={e => setQuickLessonNotes(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-1 focus:ring-blue-600/20"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isAddingQuickLesson || !quickLessonDate || !quickLessonStartTime || !quickLessonEndTime}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                      >
                        {isAddingQuickLesson ? (
                          <div className="w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Plus size={12} weight="bold" />
                            <span>Ders Ekle</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Homework Form */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BookOpen size={18} className="text-blue-600" />
                      <span className="text-[10px] font-black text-gray-900 uppercase tracking-wider block">Direkt Ödev Ver</span>
                    </div>

                    <form onSubmit={handleQuickHomeworkAssign} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-wider pl-1">Ödev Konusu / Görev</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Örn: Sayfa 40-45 arasındaki testler tamamlanacak."
                          value={newHomeworkTask}
                          onChange={e => setNewHomeworkTask(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-1 focus:ring-blue-600/20 resize-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-wider pl-1">Teslim Tarihi (Opsiyonel)</label>
                        <input
                          type="date"
                          value={newHomeworkDueDate}
                          onChange={e => setNewHomeworkDueDate(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-1 focus:ring-blue-600/20"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isAssigningHomework || !newHomeworkTask.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                      >
                        {isAssigningHomework ? (
                          <div className="w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Plus size={12} weight="bold" />
                            <span>Ödev Tanımla</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setSelectedStudent(null);
                    setNewHomeworkTask("");
                    setNewHomeworkDueDate("");
                    setQuickLessonDate("");
                    setQuickLessonStartTime("");
                    setQuickLessonEndTime("");
                    setQuickLessonNotes("");
                  }}
                  className="bg-gray-950 hover:bg-gray-800 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED LESSON INFO DIALOG/MODAL */}
      <AnimatePresence>
        {selectedLesson && (
          <div
            onClick={() => setSelectedLesson(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative border border-gray-100"
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
                      {selectedLesson.start_time.slice(0, 5)} - {selectedLesson.end_time.slice(0, 5)}
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

      {/* MOBILE BOTTOM APPBAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-2 z-40 flex justify-between gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] pb-safe-bottom">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id as TabType);
              setFormPreFill({});
            }}
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${activeTab === item.id
              ? "text-blue-600 font-black"
              : "text-gray-400 hover:text-gray-600"
              }`}
          >
            <item.icon size={22} weight={activeTab === item.id ? "fill" : "bold"} />
            <span className="text-[9px] mt-0.5 tracking-tight uppercase">{item.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* MOBILE FLOATING ACTION BUTTON */}
      {!loading && activeTab === "schedule" && !activeFollowedShareId && (
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 z-40 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={24} weight="bold" />
        </button>
      )}

      {/* MOBILE DRAFT LESSON BOTTOM DRAWER REMOVED AS PER USER REQUEST */}


    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="py-20 flex flex-col items-center text-center px-10 bg-white rounded-3xl border border-dashed border-gray-200">
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

  // Duration State in minutes
  const [duration, setDuration] = useState<string>("30");

  // Homework Form
  const [homeworkData, setHomeworkData] = useState({
    studentId: "", task: "", dueDate: ""
  });

  // Payment Form
  const [paymentData, setPaymentData] = useState({
    studentId: "", amount: "", isPaid: false, count: "1"
  });

  // Helper function to add minutes to time string (HH:MM)
  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    if (!startTime) return "";
    const [h, m] = startTime.split(":").map(Number);
    const totalMins = h * 60 + m + durationMinutes;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    return `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
  };

  // Re-run setLessonData when preFill changes
  useEffect(() => {
    if (preFill.date || preFill.startTime) {
      const initialStart = preFill.startTime || "18:00";
      const initialEnd = preFill.endTime || "19:00";

      // Calculate initial duration difference in minutes
      const [sH, sM] = initialStart.split(":").map(Number);
      const [eH, eM] = initialEnd.split(":").map(Number);
      const diff = (eH * 60 + eM) - (sH * 60 + sM);

      setLessonData(prev => ({
        ...prev,
        date: preFill.date || prev.date,
        start: initialStart,
        end: initialEnd
      }));
      setDuration(String(diff > 0 ? diff : 30));
      setType("schedule");
    }
  }, [preFill]);

  // Sync end time when start time or duration changes
  useEffect(() => {
    if (duration !== "custom") {
      const endVal = calculateEndTime(lessonData.start, Number(duration));
      setLessonData(prev => ({ ...prev, end: endVal }));
    }
  }, [lessonData.start, duration]);

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
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {type === "students" && (
        <div className="space-y-4">
          <Input label="Öğrenci Adı" value={studentData.name} onChange={v => setStudentData({ ...studentData, name: v })} placeholder="Örn: Ayşe Yılmaz" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ders" value={studentData.subject} onChange={v => setStudentData({ ...studentData, subject: v })} placeholder="Örn: Matematik" />
            <Input label="Seviye" value={studentData.level} onChange={v => setStudentData({ ...studentData, level: v })} placeholder="Örn: 8. Sınıf" />
          </div>
          <Input label="Veli İletişim" value={studentData.parentContact} onChange={v => setStudentData({ ...studentData, parentContact: v })} placeholder="Telefon veya Not" />
          <Input label="Saatlik Ücret (₺)" type="number" value={studentData.hourlyRate} onChange={v => setStudentData({ ...studentData, hourlyRate: v })} />
        </div>
      )}

      {type === "schedule" && (
        <div className="space-y-4">
          <Select label="Öğrenci" value={lessonData.studentId} onChange={v => setLessonData({ ...lessonData, studentId: v })} options={students.map(s => ({ id: s.id, label: s.name }))} />
          <Input label="Tarih" type="date" value={lessonData.date} onChange={v => setLessonData({ ...lessonData, date: v })} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Başlangıç" type="time" value={lessonData.start} onChange={v => setLessonData({ ...lessonData, start: v })} />

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Ders Süresi</label>
              <select
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600/10 transition-all outline-none appearance-none"
              >
                <option value="30">30 Dakika (1 Yarım Saat)</option>
                <option value="60">60 Dakika (2 Yarım Saat)</option>
                <option value="90">90 Dakika (3 Yarım Saat)</option>
                <option value="120">120 Dakika (4 Yarım Saat)</option>
                <option value="custom">Özel Bitiş Saati</option>
              </select>
            </div>
          </div>

          {duration === "custom" ? (
            <Input label="Bitiş Saati" type="time" value={lessonData.end} onChange={v => setLessonData({ ...lessonData, end: v })} />
          ) : (
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Otomatik Bitiş Saati</span>
              <span className="text-sm font-black text-gray-900 bg-white px-3 py-1 rounded-xl shadow-sm border border-gray-100">{lessonData.end}</span>
            </div>
          )}

          <Input label="Ders Notu" value={lessonData.notes} onChange={v => setLessonData({ ...lessonData, notes: v })} placeholder="Bu ders ne işlendi?" />
          <Input label="Gelecek Ders" value={lessonData.nextPlan} onChange={v => setLessonData({ ...lessonData, nextPlan: v })} placeholder="Hangi konuyla devam edilecek?" />
        </div>
      )}

      {type === "homework" && (
        <div className="space-y-4">
          <Select label="Öğrenci" value={homeworkData.studentId} onChange={v => setHomeworkData({ ...homeworkData, studentId: v })} options={students.map(s => ({ id: s.id, label: s.name }))} />
          <Input label="Ödev Tanımı" value={homeworkData.task} onChange={v => setHomeworkData({ ...homeworkData, task: v })} placeholder="Örn: Sayfa 32-35 arası çözülecek" />
          <Input label="Teslim Tarihi" type="date" value={homeworkData.dueDate} onChange={v => setHomeworkData({ ...homeworkData, dueDate: v })} />
        </div>
      )}

      {type === "payments" && (
        <div className="space-y-4">
          <Select label="Öğrenci" value={paymentData.studentId} onChange={v => setPaymentData({ ...paymentData, studentId: v })} options={students.map(s => ({ id: s.id, label: s.name }))} />
          <Input label="Tutar (₺)" type="number" value={paymentData.amount} onChange={v => setPaymentData({ ...paymentData, amount: v })} />
          <Input label="Ders Sayısı" type="number" value={paymentData.count} onChange={v => setPaymentData({ ...paymentData, count: v })} />
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
            <input type="checkbox" checked={paymentData.isPaid} onChange={e => setPaymentData({ ...paymentData, isPaid: e.target.checked })} className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500" />
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
