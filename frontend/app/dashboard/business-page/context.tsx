"use client";

import { createContext, useContext, useState, useEffect, ReactNode, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { business_page, business } from "@/lib/client";
import { toast } from "react-hot-toast";

const client = createBrowserClient();

interface BusinessPageContextType {
  id: string;
  loading: boolean;
  business: business.Business | null;
  links: business_page.Link[];
  refreshData: () => Promise<void>;
}

const BusinessPageContext = createContext<BusinessPageContextType | undefined>(undefined);

function BusinessPageProviderInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const { user, isLoaded: isUserLoaded } = useUser();
  
  const [loading, setLoading] = useState(true);
  const [bizData, setBizData] = useState<business.Business | null>(null);
  const [links, setLinks] = useState<business_page.Link[]>([]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const bizRes = await client.business.getBusiness(id);
      if (bizRes.business) {
        setBizData(bizRes.business);
      }

      const linksRes = await client.business_page.getLinks(id);
      setLinks(linksRes.links || []);
    } catch (err) {
      console.error(err);
      toast.error("İşletme sayfası bilgileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoaded && user && id) {
      loadData();
    }
  }, [isUserLoaded, user, id]);

  return (
    <BusinessPageContext.Provider value={{
      id,
      loading,
      business: bizData,
      links,
      refreshData: loadData,
    }}>
      {children}
    </BusinessPageContext.Provider>
  );
}

export function useBusinessPage() {
  const context = useContext(BusinessPageContext);
  if (context === undefined) {
    throw new Error("useBusinessPage must be used within a BusinessPageProvider");
  }
  return context;
}

export function BusinessPageProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#F8F9FA]">
          <div className="w-12 h-12 border-4 border-stone-100 border-t-stone-900 rounded-full animate-spin" />
        </div>
      }
    >
      <BusinessPageProviderInner>{children}</BusinessPageProviderInner>
    </Suspense>
  );
}
