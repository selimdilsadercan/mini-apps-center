import { CronJob } from "encore.dev/cron";
import { runSyncPopularFilms, runSyncBigMatches } from "./api";

// Her gece saat 03:00'te popüler filmleri senkronize eder
// (İlk 3 sayfayı çekerek en trend 60 filmi yerel veritabanında güncel tutar)
const _ = new CronJob("sync-catalog-popular-films", {
  title: "Catalog — TMDB popüler filmleri yerel veritabanıyla senkronize et",
  every: "24h", 
  endpoint: runSyncPopularFilms,
});

// Her 10 dakikada bir ESPN ve TSDB spor maçlarını senkronize eder
const _matches = new CronJob("sync-catalog-sports-matches", {
  title: "Catalog — ESPN ve TSDB spor maçlarını senkronize et",
  every: "10m",
  endpoint: runSyncBigMatches,
});
