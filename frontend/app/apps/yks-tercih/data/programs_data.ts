import fullDataset from "./yks_programs.json";

export interface ProgramHistory {
  year: number;
  rank: number | null;
  score: number | null;
  quota: number;
}

export interface YKSProgram {
  id: string;
  code: string;
  universityName: string;
  facultyName: string;
  departmentName: string;
  language?: string;
  scoreType: "SAY" | "EA" | "SÖZ" | "DİL" | "TYT";
  city: string;
  universityType: "Devlet" | "Vakıf" | "KKTC" | "Yurtdışı";
  scholarshipType: "Ücretsiz" | "Burslu" | "%75 İndirimli" | "%50 İndirimli" | "%25 İndirimli" | "Ücretli";
  durationYears: 2 | 4;
  history: ProgramHistory[];
}

export const YKS_PROGRAMS: YKSProgram[] = fullDataset as YKSProgram[];
