"use client";

import { createContext, useContext } from "react";
import type { stamp_card, business } from "@/lib/client";

export interface BusinessContextType {
  id: string;
  business: business.Business | null;
  loading: boolean;
  refreshBusiness: () => Promise<void>;
  stampCampaign: stamp_card.UserOwnedBusiness | null;
}

export const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) throw new Error("useBusiness must be used within a BusinessProvider");
  return context;
}
