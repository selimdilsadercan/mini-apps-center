/**
 * Export ExerciseDB (exercises-cli) + images from free-exercise-db + Turkish names.
 * Run: npm run gym:sync-exercises
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { translateExerciseName, translateMuscleGroup } from "./exercise-tr-map.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, "..", "..", "..", "..");
const outPath = join(frontendRoot, "public", "gym", "exercises.json");
const IMAGE_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function buildImageLookup(fedExercises) {
  const exact = new Map();
  const all = [];

  for (const ex of fedExercises) {
    if (!ex.images?.[0]) continue;
    const entry = {
      imageUrl: `${IMAGE_BASE}${ex.images[0]}`,
      norm: normalizeName(ex.name),
    };
    if (!exact.has(entry.norm)) exact.set(entry.norm, entry.imageUrl);
    all.push(entry);
  }

  return { exact, all };
}

function findImageUrl(name, lookup) {
  const norm = normalizeName(name);
  const exact = lookup.exact.get(norm);
  if (exact) return exact;

  let best = null;
  let bestScore = 0;
  for (const entry of lookup.all) {
    if (entry.norm.includes(norm) || norm.includes(entry.norm)) {
      const score = Math.min(entry.norm.length, norm.length);
      if (score > bestScore) {
        bestScore = score;
        best = entry.imageUrl;
      }
    }
  }
  return best;
}

async function fetchWgerTrMap() {
  const map = new Map();
  let url = "https://wger.de/api/v2/exerciseinfo/?limit=100";

  while (url) {
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();

    for (const ex of data.results ?? []) {
      const en = ex.translations?.find((t) => t.language === 2);
      const tr = ex.translations?.find((t) => t.language === 16);
      if (!en?.name?.trim() || !tr?.name?.trim()) continue;

      map.set(normalizeName(en.name), tr.name.trim());
      for (const alias of en.aliases ?? []) {
        if (alias.alias?.trim()) {
          map.set(normalizeName(alias.alias), tr.name.trim());
        }
      }
    }

    url = data.next;
  }

  return map;
}

async function main() {
  const result = spawnSync("npx", ["exercises-cli", "export", "--format", "json"], {
    encoding: "utf8",
    cwd: frontendRoot,
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.error || result.status !== 0) {
    console.error(result.stderr || result.error);
    process.exit(1);
  }

  const exercises = JSON.parse(result.stdout);

  const fedRes = await fetch(
    "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
  );
  if (!fedRes.ok) {
    console.error("Failed to fetch free-exercise-db images");
    process.exit(1);
  }
  const fedExercises = await fedRes.json();
  const lookup = buildImageLookup(fedExercises);
  const wgerTrMap = await fetchWgerTrMap();
  console.log(`Loaded ${wgerTrMap.size} wger Turkish exercise names`);

  let withImages = 0;
  let withWgerTr = 0;
  const catalog = exercises.map((ex) => {
    const primary =
      ex.muscleGroups?.find((m) => m.type === "primary") ?? ex.muscleGroups?.[0];
    const muscleGroupEn = primary?.name ?? "General";
    const imageUrl = findImageUrl(ex.name, lookup);
    if (imageUrl) withImages++;

    const nameEn = ex.name;
    const nameTr = translateExerciseName(nameEn, wgerTrMap);
    if (wgerTrMap.has(normalizeName(nameEn))) withWgerTr++;

    return {
      slug: ex.id,
      name: nameTr,
      nameEn,
      muscleGroup: translateMuscleGroup(muscleGroupEn),
      muscleGroupEn,
      muscleSlug: primary?.slug ?? "general",
      equipment: (ex.equipment ?? []).map((e) => e.name),
      difficultyLevel: ex.difficultyLevel ?? null,
      category: ex.category ?? null,
      imageUrl,
    };
  });

  catalog.sort((a, b) => a.name.localeCompare(b.name, "tr"));

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(catalog), "utf8");
  console.log(
    `Wrote ${catalog.length} exercises (${withImages} with images, ${withWgerTr} wger TR matches) to ${outPath}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
