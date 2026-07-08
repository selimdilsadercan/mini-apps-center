"use client";

import { useEffect, useState } from "react";
import { loadExerciseCatalog, type ExerciseCatalogItem } from "../exercises";

export function useExerciseCatalog() {
  const [catalog, setCatalog] = useState<ExerciseCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExerciseCatalog()
      .then(setCatalog)
      .catch((err) => setError(err instanceof Error ? err.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  return { catalog, loading, error };
}
