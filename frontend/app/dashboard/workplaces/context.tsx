"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/api";
import { business, workplaces } from "@/lib/client";
import { toast } from "react-hot-toast";

const client = createBrowserClient();

interface WorkplacesContextType {
  business: business.Business | null;
  places: workplaces.Place[];
  loading: boolean;
  refreshPlaces: () => Promise<void>;
  businessId: string;
}

const WorkplacesContext = createContext<WorkplacesContextType | undefined>(undefined);

export function WorkplacesProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const businessId = searchParams.get("id") || "";
  const [biz, setBiz] = useState<business.Business | null>(null);
  const [places, setPlaces] = useState<workplaces.Place[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const [bizRes, placesRes] = await Promise.all([
        client.business.getBusiness(businessId),
        client.workplaces.listPlacesByBusiness(businessId)
      ]);
      setBiz(bizRes.business || null);
      setPlaces(placesRes.places || []);
    } catch (err) {
      console.error("Failed to load workplaces data:", err);
      toast.error("Veriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  return (
    <WorkplacesContext.Provider
      value={{
        business: biz,
        places,
        loading,
        refreshPlaces: loadData,
        businessId
      }}
    >
      {children}
    </WorkplacesContext.Provider>
  );
}

export function useWorkplaces() {
  const context = useContext(WorkplacesContext);
  if (!context) {
    throw new Error("useWorkplaces must be used within a WorkplacesProvider");
  }
  return context;
}
