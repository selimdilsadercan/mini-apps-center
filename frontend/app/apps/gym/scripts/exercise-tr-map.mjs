/** Turkish display names for muscles and common exercise terms */

export const MUSCLE_GROUP_TR = {
  Chest: "Göğüs",
  Shoulders: "Omuz",
  Biceps: "Biceps",
  Triceps: "Triceps",
  Forearms: "Ön kol",
  Abdominals: "Karın",
  Quadriceps: "Quadriceps",
  Hamstrings: "Hamstring",
  Glutes: "Kalça",
  Calves: "Baldır",
  "Middle Back": "Orta sırt",
  Lats: "Lat",
  "Lower Back": "Bel",
  Traps: "Trapez",
  Neck: "Boyun",
  General: "Genel",
  Adductors: "Adduktor",
  Abductors: "Abduktor",
};

export const EXACT_NAME_TR = {
  "push up": "Şınav",
  "push-up": "Şınav",
  "pull up": "Barfiks",
  "pull-up": "Barfiks",
  "chin up": "Barfiks",
  "chin-up": "Barfiks",
  plank: "Plank",
  crunch: "Mekik",
  "sit up": "Mekik",
  "sit-up": "Mekik",
  burpee: "Burpee",
  "jumping jack": "Jumping Jack",
  lunge: "Lunge",
  squat: "Squat",
  deadlift: "Deadlift",
  "bench press": "Bench Press",
  "goblet squat": "Goblet Squat",
  "lat pulldown": "Lat Pulldown",
  "leg press": "Leg Press",
  "bicep curl": "Biceps Curl",
  "hammer curl": "Hammer Curl",
  "triceps dip": "Triceps Dip",
  "calf raise": "Baldır Kaldırma",
  "leg raise": "Bacak Kaldırma",
  "hip thrust": "Hip Thrust",
  "romanian deadlift": "Romanian Deadlift",
  "shoulder press": "Omuz Press",
  "overhead press": "Overhead Press",
  "face pull": "Face Pull",
  row: "Row",
};

const PHRASE_TR = [
  ["barbell bench press", "Halter Bench Press"],
  ["dumbbell bench press", "Dambıl Bench Press"],
  ["incline bench press", "Eğimli Bench Press"],
  ["decline bench press", "Decline Bench Press"],
  ["barbell squat", "Halter Squat"],
  ["front squat", "Front Squat"],
  ["back squat", "Back Squat"],
  ["bulgarian split squat", "Bulgarian Split Squat"],
  ["dumbbell row", "Dumbbell Row"],
  ["barbell row", "Barbell Row"],
  ["lat pulldown", "Lat Pulldown"],
  ["leg curl", "Leg Curl"],
  ["leg extension", "Leg Extension"],
  ["chest fly", "Chest Fly"],
  ["pec deck", "Pec Deck"],
  ["skull crusher", "Skull Crusher"],
  ["tricep extension", "Triceps Extension"],
  ["bicep curl", "Biceps Curl"],
  ["hammer curl", "Hammer Curl"],
  ["preacher curl", "Preacher Curl"],
  ["lateral raise", "Lateral Raise"],
  ["front raise", "Front Raise"],
  ["rear delt fly", "Rear Delt Fly"],
  ["reverse fly", "Reverse Fly"],
  ["hip abduction", "Kalça Abduksiyon"],
  ["hip adduction", "Kalça Adduksiyon"],
  ["calf raise", "Baldır Kaldırma"],
  ["push up", "Şınav"],
  ["pull up", "Barfiks"],
  ["chin up", "Barfiks"],
  ["sit up", "Mekik"],
  ["jump squat", "Jump Squat"],
  ["box jump", "Box Jump"],
  ["mountain climber", "Mountain Climber"],
  ["russian twist", "Russian Twist"],
  ["good morning", "Good Morning"],
  ["farmer walk", "Farmer Walk"],
  ["kettlebell swing", "Kettlebell Swing"],
  ["clean and press", "Clean and Press"],
  ["power clean", "Power Clean"],
  ["hang clean", "Hang Clean"],
  ["snatch", "Snatch"],
];

const WORD_TR = [
  ["dumbbell", "Dambıl"],
  ["barbell", "Halter"],
  ["kettlebell", "Kettlebell"],
  ["cable", "Kablolu"],
  ["machine", "Makine"],
  ["band", "Band"],
  ["bodyweight", "Vücut Ağırlığı"],
  ["body weight", "Vücut Ağırlığı"],
  ["smith", "Smith"],
  ["ez bar", "EZ Bar"],
  ["stability ball", "Pilates Topu"],
  ["exercise ball", "Pilates Topu"],
  ["medicine ball", "Medisin Topu"],
  ["resistance band", "Direnç Bandı"],
  ["incline", "Eğimli"],
  ["decline", "Decline"],
  ["seated", "Oturarak"],
  ["standing", "Ayakta"],
  ["lying", "Yatarak"],
  ["single arm", "Tek Kol"],
  ["single leg", "Tek Bacak"],
  ["alternate", "Alternatif"],
  ["alternating", "Alternatif"],
  ["reverse", "Ters"],
  ["wide grip", "Geniş Tutuş"],
  ["close grip", "Dar Tutuş"],
  ["one arm", "Tek Kol"],
  ["one leg", "Tek Bacak"],
];

function normalizeKey(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function titleCaseTr(text) {
  return text
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function translateExerciseName(enName, wgerTrMap = new Map()) {
  const key = normalizeKey(enName);
  if (wgerTrMap.has(key)) return wgerTrMap.get(key);
  if (EXACT_NAME_TR[key]) return EXACT_NAME_TR[key];

  let working = key;
  for (const [en, tr] of PHRASE_TR) {
    if (working.includes(en)) {
      working = working.replace(en, tr.toLowerCase());
    }
  }

  let result = working;
  for (const [en, tr] of WORD_TR) {
    result = result.replace(new RegExp(`\\b${en}\\b`, "gi"), tr);
  }

  if (result === key) return enName;
  return titleCaseTr(result);
}

export function translateMuscleGroup(enGroup) {
  return MUSCLE_GROUP_TR[enGroup] ?? enGroup;
}
