"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { workplaces } from "@/lib/client";
import { useTranslations } from "@/contexts/LanguageContext";
import { DEFAULT_VENUE_CITY } from "../lib/venue-types";

export function useWorkplacesPlaces() {
  const t = useTranslations("workplaces");
  const client = useMemo(() => createBrowserClient(), []);
  const { user } = useUser();
  const [places, setPlaces] = useState<workplaces.Place[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaces = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.workplaces.listPlaces({
        userId: user?.id,
        city: DEFAULT_VENUE_CITY,
      });
      setPlaces(res.places ?? []);
    } catch (err) {
      console.error("Failed to fetch places:", err);
      toast.error(t("toast.loadFailed"));
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [client, user?.id]);

  useEffect(() => {
    void fetchPlaces();
  }, [fetchPlaces]);

  return { places, loading, fetchPlaces, user, t };
}
