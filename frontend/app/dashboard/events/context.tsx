"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/api";
import { business, campus_events } from "@/lib/client";
import { toast } from "react-hot-toast";

const client = createBrowserClient();

interface EventsContextType {
  business: business.Business | null;
  events: campus_events.CampusEvent[];
  loading: boolean;
  refreshEvents: () => Promise<void>;
  businessId: string;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const businessId = searchParams.get("id") || "";
  const [biz, setBiz] = useState<business.Business | null>(null);
  const [events, setEvents] = useState<campus_events.CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const [bizRes, eventsRes] = await Promise.all([
        client.business.getBusiness(businessId),
        client.campus_events.getEvents({ businessId })
      ]);
      setBiz(bizRes.business || null);
      setEvents(eventsRes.events || []);
    } catch (err) {
      console.error("Failed to load events data:", err);
      toast.error("Veriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  return (
    <EventsContext.Provider
      value={{
        business: biz,
        events,
        loading,
        refreshEvents: loadData,
        businessId
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEvents must be used within an EventsProvider");
  }
  return context;
}
