/** TUS kontenjan türü kısaltmaları — kaynak: tuskocu.com */
export const INSTITUTION_TYPE_LABELS: Record<string, string> = {
  YÖK: "Üniversite Tıp Kontenjanları",
  SBA: "Sağlık Bakanlığı Adına Üniversite Tıp Kontenjanları",
  EAH: "Sağlık Bakanlığı Eğitim ve Araştırma Hastanesi Kontenjanları",
  MSB: "Milli Savunma Bakanlığı Kontenjanları",
  İÇB: "İçişleri Bakanlığı Tıp Kontenjanları",
  ADL: "Adalet Bakanlığı Tıp Kontenjanları",
  MAP: "Misafir Askeri Personel Kontenjanları",
  YBU: "Yabancı Uyruklu Kontenjanları",
  KKTC: "KKTC Kontenjanları",
  Genel: "Genel Kontenjanlar",
  BNDH: "Bölge Hastanesi Kontenjanları",
};

export const INSTITUTION_TYPE_ORDER = [
  "YÖK",
  "SBA",
  "EAH",
  "MSB",
  "İÇB",
  "ADL",
  "MAP",
  "YBU",
  "KKTC",
  "Genel",
  "BNDH",
] as const;

export function getInstitutionTypeLabel(type: string): string {
  return INSTITUTION_TYPE_LABELS[type] ?? type;
}

export function formatInstitutionTypeOption(type: string): string {
  const label = getInstitutionTypeLabel(type);
  return label === type ? type : `${type} — ${label}`;
}

export function getInstitutionTypeBadgeClass(type: string): string {
  switch (type) {
    case "EAH":
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200/50";
    case "SBA":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200/50";
    case "YÖK":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200/50";
    case "MSB":
      return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200/50";
    case "ADL":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200/50";
    case "MAP":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200/50";
    case "YBU":
      return "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200/50";
    case "KKTC":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200/50";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200/50";
  }
}
