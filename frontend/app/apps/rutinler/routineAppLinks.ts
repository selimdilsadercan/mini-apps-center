export type LinkedAppInfo = {
  appHref: string;
  label: string;
  keywords: string[];
};

export const ROUTINE_APP_MAPPINGS: LinkedAppInfo[] = [
  { keywords: ["antrenman", "gym", "fitness", "idman"], appHref: "/apps/gym", label: "Gym" },
  { keywords: ["sağlıklı öğün", "yemek hazırlığı", "beslenme"], appHref: "/apps/recipe", label: "Yemek" },
  { keywords: ["kitap okuma", "kitap"], appHref: "/apps/read-tracker", label: "Kitap" },
  { keywords: ["bulaşık", "çamaşır", "süpürme", "ev işleri", "ev düzenleme"], appHref: "/apps/ev-isleri", label: "Ev İşleri" },
  { keywords: ["alışveriş", "market", "eksik var"], appHref: "/apps/eksik-var", label: "Eksik Var" },
  { keywords: ["ders çalışma", "pomodoro"], appHref: "/apps/study", label: "Ders" },
  { keywords: ["film", "dizi"], appHref: "/apps/series-track", label: "Dizi" },
];

export function getLinkedAppForRoutine(itemName?: string | null): LinkedAppInfo | null {
  if (!itemName) return null;
  const nameLower = itemName.toLowerCase();
  return ROUTINE_APP_MAPPINGS.find((m) =>
    m.keywords.some((kw) => nameLower.includes(kw))
  ) || null;
}
