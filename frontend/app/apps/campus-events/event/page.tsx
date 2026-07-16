"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import {
  CaretLeft,
  MapPin,
  Calendar,
  Megaphone,
  Info,
  ShareNetwork,
  Clock,
  ListChecks,
  CheckCircle,
  X,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { campus_events } from "@/lib/client";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import { Drawer } from "vaul";

const client = createBrowserClient();
const ACCENT = "#00aeef";

const TR_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"] as const;

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.getDate(),
    month: TR_MONTHS[d.getMonth()],
    weekday: d.toLocaleDateString("tr-TR", { weekday: "long" }),
    date: d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
    time: d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function EventDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const eventId = searchParams.get("id");

  const [event, setEvent] = useState<campus_events.CampusEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showApplyDrawer, setShowApplyDrawer] = useState(false);
  const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});
  const [submittingForm, setSubmittingForm] = useState(false);

  useEffect(() => {
    if (!eventId) {
      toast.error("Etkinlik ID'si bulunamadı.");
      router.push("/apps/campus-events");
      return;
    }

    if (isUserLoaded) {
      fetchEvent();
    }
  }, [eventId, isUserLoaded, user?.id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await client.campus_events.getEvent(eventId!, { userId: user?.id });
      setEvent(res.event);
    } catch (err) {
      console.error("Error fetching event data:", err);
      toast.error("Etkinlik bilgileri yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAttendance = async (status: string) => {
    if (!isUserLoaded || !user) {
      toast.error("Katılım işaretlemek için giriş yapmalısınız.");
      return;
    }

    try {
      setSubmitting(true);
      await client.campus_events.setAttendance({
        userId: user.id,
        eventId: event!.id,
        status: event!.user_status === status ? "none" : status,
      });
      fetchEvent();
      toast.success(event!.user_status === status ? "Katılım iptal edildi." : "Katılım durumunuz güncellendi.");
    } catch (e) {
      console.error(e);
      toast.error("Katılım güncellenirken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Başvuru yapmak için giriş yapmalısınız.");
      return;
    }

    try {
      setSubmittingForm(true);
      await client.campus_events.submitForm({
        userId: user.id,
        eventId: event!.id,
        answers: formAnswers,
      });
      toast.success("Başvurunuz başarıyla alındı!");
      setShowApplyDrawer(false);
      fetchEvent();
    } catch (err) {
      console.error("Failed to submit form:", err);
      toast.error("Başvuru gönderilirken bir hata oluştu.");
    } finally {
      setSubmittingForm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-app-bg">
        <div className="w-8 h-8 border-2 border-app-border border-t-[#00aeef] rounded-full animate-spin" />
        <span className="text-app-muted text-xs font-bold uppercase tracking-widest">Yükleniyor...</span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-app-bg">
        <Info size={40} className="text-app-muted mb-4" />
        <h1 className="text-lg font-black text-app-text mb-2">Etkinlik Bulunamadı</h1>
        <p className="text-app-muted text-sm mb-6">Aradığınız etkinlik sistemde kayıtlı olmayabilir.</p>
        <button
          onClick={() => router.push("/apps/campus-events")}
          className="text-white px-5 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all"
          style={{ backgroundColor: ACCENT }}
        >
          Etkinliklere Dön
        </button>
      </div>
    );
  }

  const { day, month, date, time } = formatEventDate(event.event_date);
  const isGoing = event.user_status === "going";
  const isInterested = event.user_status === "interested";

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text font-sans antialiased">
      <Toaster position="top-center" />

      <header className="sticky top-0 z-30 app-chrome-top">
        <div className="flex items-center justify-between px-4 py-3 max-w-xl mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted bg-app-surface rounded-lg border border-app-border active:scale-95 transition-all"
          >
            <CaretLeft size={14} weight="bold" style={{ color: ACCENT }} />
          </button>
          <h1 className="text-sm font-black uppercase tracking-tight truncate px-2">Etkinlik</h1>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link kopyalandı!");
            }}
            className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted bg-app-surface rounded-lg border border-app-border active:scale-95 transition-all"
          >
            <ShareNetwork size={14} weight="bold" style={{ color: ACCENT }} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-8 max-w-xl mx-auto w-full space-y-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-app-surface border border-app-border rounded-xl overflow-hidden shadow-sm">
          <div className="relative">
            <div className="aspect-[16/9] bg-app-surface-muted">
              {event.image_url ? (
                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Megaphone size={40} className="text-app-muted" />
                </div>
              )}
            </div>
            <div className="absolute top-3 left-3 w-11 rounded-lg flex flex-col items-center justify-center py-1 shadow-sm border bg-app-surface border-app-border">
              <span className="text-sm font-black leading-none">{day}</span>
              <span className="text-[8px] font-bold uppercase leading-none text-app-muted">{month}</span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {event.organizer_club && (
              <div>
                {event.businessId ? (
                  <Link
                    href={`/apps/campus-events/venue?id=${event.businessId}`}
                    className="text-[10px] font-black uppercase tracking-wide"
                    style={{ color: ACCENT }}
                  >
                    {event.organizer_club}
                  </Link>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-wide text-app-muted">{event.organizer_club}</span>
                )}
              </div>
            )}
            <h1 className="text-lg font-black text-app-text leading-snug">{event.title}</h1>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-app-muted text-[11px] font-medium">
                <Calendar size={13} weight="bold" className="shrink-0" style={{ color: ACCENT }} />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-2 text-app-muted text-[11px] font-medium">
                <Clock size={13} weight="bold" className="shrink-0" style={{ color: ACCENT }} />
                <span>{time}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-app-muted text-[11px] font-medium">
                  <MapPin size={13} weight="bold" className="shrink-0" style={{ color: ACCENT }} />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="flex gap-2">
          <button
            onClick={() => handleToggleAttendance("interested")}
            disabled={submitting}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all active:scale-[0.98] disabled:opacity-50 ${
              isInterested ? "text-white" : "bg-app-surface border border-app-border text-app-muted"
            }`}
            style={isInterested ? { backgroundColor: ACCENT } : undefined}
          >
            İlgileniyorum
          </button>
          <button
            onClick={() => handleToggleAttendance("going")}
            disabled={submitting}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all active:scale-[0.98] disabled:opacity-50 ${
              isGoing ? "text-white" : "bg-gray-900 text-white"
            }`}
            style={isGoing ? { backgroundColor: ACCENT } : undefined}
          >
            Katılıyorum
          </button>
        </div>

        {event.has_form && (
          <section className="bg-app-surface border border-app-border rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-black text-app-text flex items-center gap-1.5">
                  <ListChecks size={16} weight="bold" style={{ color: ACCENT }} />
                  Başvuru Gerekli
                </h3>
                <p className="text-app-muted text-[11px] font-medium mt-1">Katılmak için başvuru formunu doldurun.</p>
              </div>
              {event.user_submission ? (
                <div className="shrink-0 flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg text-[10px] font-black border border-emerald-100">
                  <CheckCircle size={14} weight="fill" />
                  Alındı
                </div>
              ) : (
                <button
                  onClick={() => setShowApplyDrawer(true)}
                  className="shrink-0 text-white px-4 py-2 rounded-xl font-black text-[10px] active:scale-95 transition-all"
                  style={{ backgroundColor: ACCENT }}
                >
                  Başvur
                </button>
              )}
            </div>
          </section>
        )}

        <section className="bg-app-surface border border-app-border rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-black text-app-text mb-3 flex items-center gap-1.5">
            <Info size={16} weight="bold" style={{ color: ACCENT }} />
            Etkinlik Hakkında
          </h2>
          <p className="text-app-muted text-sm leading-relaxed font-medium whitespace-pre-wrap">
            {event.description || "Bu etkinlik için bir açıklama girilmemiş."}
          </p>
        </section>
      </main>

      <Drawer.Root open={showApplyDrawer} onOpenChange={setShowApplyDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-gray-950/40 backdrop-blur-xs z-[60]" />
          <Drawer.Content className="bg-app-surface text-app-text flex flex-col rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[70] max-w-xl mx-auto border-t border-app-border">
            <div className="p-6 overflow-y-auto flex-1 scrollbar-none">
              <div className="mx-auto w-10 h-1 rounded-full bg-app-border mb-6" />
              <div className="flex items-center justify-between mb-5">
                <div>
                  <Drawer.Title className="text-lg font-black tracking-tight text-app-text">Başvuru Formu</Drawer.Title>
                  <Drawer.Description className="text-xs text-app-muted font-medium mt-0.5">{event.title}</Drawer.Description>
                </div>
                <button onClick={() => setShowApplyDrawer(false)} className="p-1.5 hover:bg-app-surface-muted rounded-lg transition-colors">
                  <X size={20} weight="bold" className="text-app-muted" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 pb-8">
                {event.form_questions?.map((q: { label: string; required?: boolean; type?: string }, idx: number) => (
                  <div key={idx} className="space-y-1.5">
                    <label className="text-[10px] font-black text-app-muted uppercase tracking-wide px-0.5">
                      {q.label} {q.required && <span className="text-red-500">*</span>}
                    </label>
                    {q.type === "textarea" ? (
                      <textarea
                        required={q.required}
                        value={formAnswers[q.label] || ""}
                        onChange={(e) => setFormAnswers({ ...formAnswers, [q.label]: e.target.value })}
                        className="w-full bg-app-surface-muted border border-app-border rounded-xl px-3 py-2.5 text-sm focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/10 outline-none text-app-text font-medium resize-none h-28"
                        placeholder="Cevabınız..."
                      />
                    ) : (
                      <input
                        required={q.required}
                        type={q.type === "number" ? "number" : "text"}
                        value={formAnswers[q.label] || ""}
                        onChange={(e) => setFormAnswers({ ...formAnswers, [q.label]: e.target.value })}
                        className="w-full bg-app-surface-muted border border-app-border rounded-xl px-3 py-2.5 text-sm focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/10 outline-none text-app-text font-medium"
                        placeholder="Cevabınız..."
                      />
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={submittingForm}
                  className="w-full h-12 text-white font-black rounded-xl flex items-center justify-center transition-all disabled:opacity-50 text-sm active:scale-[0.98] mt-2"
                  style={{ backgroundColor: ACCENT }}
                >
                  {submittingForm ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Başvuruyu Gönder"
                  )}
                </button>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

export default function EventDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-app-bg">
          <div className="w-8 h-8 border-2 border-app-border border-t-[#00aeef] rounded-full animate-spin" />
          <span className="text-app-muted text-xs font-bold uppercase tracking-widest">Yükleniyor...</span>
        </div>
      }
    >
      <EventDetailContent />
    </Suspense>
  );
}
