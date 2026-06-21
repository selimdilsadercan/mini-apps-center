"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { digital_menu, business } from "@/lib/client";
import { toast } from "react-hot-toast";

const client = createBrowserClient();

interface DigitalMenuContextType {
  id: string;
  loading: boolean;
  business: business.Business | null;
  menuCategories: digital_menu.Category[];
  menuItems: digital_menu.MenuItem[];
  previewRefreshKey: number;
  refreshData: () => Promise<void>;
  refreshPreview: () => void;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
}

const DigitalMenuContext = createContext<DigitalMenuContextType | undefined>(undefined);

export function DigitalMenuProvider({ children }: { children: ReactNode }) {
  const { id } = useParams() as { id: string };
  const { user, isLoaded: isUserLoaded } = useUser();
  
  const [loading, setLoading] = useState(true);
  const [bizData, setBizData] = useState<business.Business | null>(null);
  const [menuCategories, setMenuCategories] = useState<digital_menu.Category[]>([]);
  const [menuItems, setMenuItems] = useState<digital_menu.MenuItem[]>([]);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const bizRes = await client.business.getBusiness(id);
      if (bizRes.business) {
        setBizData(bizRes.business);
      }

      const menuData = await client.digital_menu.getMenuData(id);
      const categories = menuData.categories || [];
      setMenuCategories(categories);
      setMenuItems(menuData.items || []);
      
      if (categories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(categories[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Menü bilgileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoaded && user && id) {
      loadData();
    }
  }, [isUserLoaded, user, id]);

  const refreshPreview = () => setPreviewRefreshKey(prev => prev + 1);

  return (
    <DigitalMenuContext.Provider value={{
      id,
      loading,
      business: bizData,
      menuCategories,
      menuItems,
      previewRefreshKey,
      refreshData: loadData,
      refreshPreview,
      selectedCategoryId,
      setSelectedCategoryId
    }}>
      {children}
    </DigitalMenuContext.Provider>
  );
}

export function useDigitalMenu() {
  const context = useContext(DigitalMenuContext);
  if (context === undefined) {
    throw new Error("useDigitalMenu must be used within a DigitalMenuProvider");
  }
  return context;
}
