export interface ProgramHistory {
  year: number;
  rank: number | null; // e.g. 1420 (null if new or not filled)
  score: number | null; // e.g. 524.85
  quota: number;
}

export interface YKSProgram {
  id: string; // e.g. "105610011"
  code: string;
  universityName: string;
  facultyName: string;
  departmentName: string;
  language?: string; // "İngilizce", "Almanca", "Fransızca", etc.
  scoreType: "SAY" | "EA" | "SÖZ" | "DİL" | "TYT";
  city: string;
  universityType: "Devlet" | "Vakıf" | "KKTC" | "Yurtdışı";
  scholarshipType: "Ücretsiz" | "Burslu" | "%75 İndirimli" | "%50 İndirimli" | "%25 İndirimli" | "Ücretli";
  durationYears: 2 | 4;
  history: ProgramHistory[];
}

export const YKS_PROGRAMS: YKSProgram[] = [
  // --- KOÇ ÜNİVERSİTESİ ---
  {
    id: "203910012",
    code: "203910012",
    universityName: "KOÇ ÜNİVERSİTESİ",
    facultyName: "Tıp Fakültesi",
    departmentName: "Tıp",
    language: "İngilizce",
    scoreType: "SAY",
    city: "İSTANBUL",
    universityType: "Vakıf",
    scholarshipType: "Burslu",
    durationYears: 4,
    history: [
      { year: 2024, rank: 68, score: 551.2, quota: 15 },
      { year: 2023, rank: 74, score: 549.8, quota: 15 },
      { year: 2022, rank: 79, score: 547.4, quota: 15 },
      { year: 2021, rank: 85, score: 535.1, quota: 15 }
    ]
  },
  {
    id: "203910057",
    code: "203910057",
    universityName: "KOÇ ÜNİVERSİTESİ",
    facultyName: "Mühendislik Fakültesi",
    departmentName: "Bilgisayar Mühendisliği",
    language: "İngilizce",
    scoreType: "SAY",
    city: "İSTANBUL",
    universityType: "Vakıf",
    scholarshipType: "Burslu",
    durationYears: 4,
    history: [
      { year: 2024, rank: 140, score: 548.5, quota: 12 },
      { year: 2023, rank: 165, score: 546.2, quota: 12 },
      { year: 2022, rank: 190, score: 543.1, quota: 12 },
      { year: 2021, rank: 210, score: 530.0, quota: 12 }
    ]
  },
  {
    id: "203910120",
    code: "203910120",
    universityName: "KOÇ ÜNİVERSİTESİ",
    facultyName: "Hukuk Fakültesi",
    departmentName: "Hukuk",
    scoreType: "EA",
    city: "İSTANBUL",
    universityType: "Vakıf",
    scholarshipType: "Burslu",
    durationYears: 4,
    history: [
      { year: 2024, rank: 120, score: 532.1, quota: 16 },
      { year: 2023, rank: 145, score: 530.5, quota: 16 },
      { year: 2022, rank: 160, score: 527.9, quota: 16 },
      { year: 2021, rank: 175, score: 512.4, quota: 16 }
    ]
  },

  // --- BOĞAZİÇİ ÜNİVERSİTESİ ---
  {
    id: "102210113",
    code: "102210113",
    universityName: "BOĞAZİÇİ ÜNİVERSİTESİ",
    facultyName: "Mühendislik Fakültesi",
    departmentName: "Bilgisayar Mühendisliği",
    language: "İngilizce",
    scoreType: "SAY",
    city: "İSTANBUL",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 290, score: 545.8, quota: 80 },
      { year: 2023, rank: 310, score: 543.9, quota: 80 },
      { year: 2022, rank: 345, score: 540.2, quota: 80 },
      { year: 2021, rank: 370, score: 526.5, quota: 80 }
    ]
  },
  {
    id: "102210131",
    code: "102210131",
    universityName: "BOĞAZİÇİ ÜNİVERSİTESİ",
    facultyName: "Mühendislik Fakültesi",
    departmentName: "Elektrik-Elektronik Mühendisliği",
    language: "İngilizce",
    scoreType: "SAY",
    city: "İSTANBUL",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 540, score: 541.2, quota: 70 },
      { year: 2023, rank: 580, score: 539.0, quota: 70 },
      { year: 2022, rank: 620, score: 535.8, quota: 70 },
      { year: 2021, rank: 660, score: 521.9, quota: 70 }
    ]
  },
  {
    id: "102210282",
    code: "102210282",
    universityName: "BOĞAZİÇİ ÜNİVERSİTESİ",
    facultyName: "İktisadi ve İdari Bilimler Fakültesi",
    departmentName: "İşletme",
    language: "İngilizce",
    scoreType: "EA",
    city: "İSTANBUL",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 450, score: 524.5, quota: 90 },
      { year: 2023, rank: 480, score: 522.1, quota: 90 },
      { year: 2022, rank: 520, score: 518.6, quota: 90 },
      { year: 2021, rank: 560, score: 502.8, quota: 90 }
    ]
  },

  // --- İSTANBUL TEKNİK ÜNİVERSİTESİ (İTÜ) ---
  {
    id: "105610011",
    code: "105610011",
    universityName: "İSTANBUL TEKNİK ÜNİVERSİTESİ",
    facultyName: "Bilgisayar ve Bilişim Fakültesi",
    departmentName: "Bilgisayar Mühendisliği",
    language: "İngilizce",
    scoreType: "SAY",
    city: "İSTANBUL",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 720, score: 538.9, quota: 95 },
      { year: 2023, rank: 790, score: 536.4, quota: 95 },
      { year: 2022, rank: 860, score: 532.7, quota: 95 },
      { year: 2021, rank: 940, score: 518.2, quota: 95 }
    ]
  },
  {
    id: "105610029",
    code: "105610029",
    universityName: "İSTANBUL TEKNİK ÜNİVERSİTESİ",
    facultyName: "Elektrik-Elektronik Fakültesi",
    departmentName: "Yapay Zeka ve Veri Mühendisliği",
    language: "İngilizce",
    scoreType: "SAY",
    city: "İSTANBUL",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 1120, score: 534.5, quota: 40 },
      { year: 2023, rank: 1250, score: 531.8, quota: 40 },
      { year: 2022, rank: 1380, score: 528.0, quota: 40 },
      { year: 2021, rank: 1520, score: 512.9, quota: 40 }
    ]
  },
  {
    id: "105610214",
    code: "105610214",
    universityName: "İSTANBUL TEKNİK ÜNİVERSİTESİ",
    facultyName: "Mimarlık Fakültesi",
    departmentName: "Mimarlık",
    language: "İngilizce",
    scoreType: "SAY",
    city: "İSTANBUL",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 18500, score: 489.2, quota: 70 },
      { year: 2023, rank: 19800, score: 485.6, quota: 70 },
      { year: 2022, rank: 21500, score: 480.1, quota: 70 },
      { year: 2021, rank: 23000, score: 468.4, quota: 70 }
    ]
  },

  // --- ORTA DOĞU TEKNİK ÜNİVERSİTESİ (ODTÜ) ---
  {
    id: "108410141",
    code: "108410141",
    universityName: "ORTA DOĞU TEKNİK ÜNİVERSİTESİ",
    facultyName: "Mühendislik Fakültesi",
    departmentName: "Bilgisayar Mühendisliği",
    language: "İngilizce",
    scoreType: "SAY",
    city: "ANKARA",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 820, score: 537.6, quota: 100 },
      { year: 2023, rank: 890, score: 535.1, quota: 100 },
      { year: 2022, rank: 980, score: 531.0, quota: 100 },
      { year: 2021, rank: 1050, score: 516.8, quota: 100 }
    ]
  },
  {
    id: "108410168",
    code: "108410168",
    universityName: "ORTA DOĞU TEKNİK ÜNİVERSİTESİ",
    facultyName: "Mühendislik Fakültesi",
    departmentName: "Elektrik-Elektronik Mühendisliği",
    language: "İngilizce",
    scoreType: "SAY",
    city: "ANKARA",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 1450, score: 531.4, quota: 170 },
      { year: 2023, rank: 1580, score: 528.9, quota: 170 },
      { year: 2022, rank: 1720, score: 524.5, quota: 170 },
      { year: 2021, rank: 1850, score: 509.6, quota: 170 }
    ]
  },
  {
    id: "108410195",
    code: "108410195",
    universityName: "ORTA DOĞU TEKNİK ÜNİVERSİTESİ",
    facultyName: "Mühendislik Fakültesi",
    departmentName: "Havacılık ve Uzay Mühendisliği",
    language: "İngilizce",
    scoreType: "SAY",
    city: "ANKARA",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 3200, score: 519.8, quota: 80 },
      { year: 2023, rank: 3500, score: 516.5, quota: 80 },
      { year: 2022, rank: 3900, score: 511.2, quota: 80 },
      { year: 2021, rank: 4200, score: 496.0, quota: 80 }
    ]
  },

  // --- HACETTEPE ÜNİVERSİTESİ ---
  {
    id: "104810014",
    code: "104810014",
    universityName: "HACETTEPE ÜNİVERSİTESİ",
    facultyName: "Tıp Fakültesi",
    departmentName: "Tıp",
    language: "Türkçe",
    scoreType: "SAY",
    city: "ANKARA",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 1450, score: 531.5, quota: 220 },
      { year: 2023, rank: 1580, score: 528.8, quota: 220 },
      { year: 2022, rank: 1750, score: 524.2, quota: 220 },
      { year: 2021, rank: 1900, score: 509.1, quota: 220 }
    ]
  },
  {
    id: "104810023",
    code: "104810023",
    universityName: "HACETTEPE ÜNİVERSİTESİ",
    facultyName: "Tıp Fakültesi",
    departmentName: "Tıp",
    language: "İngilizce",
    scoreType: "SAY",
    city: "ANKARA",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 980, score: 536.2, quota: 160 },
      { year: 2023, rank: 1090, score: 533.5, quota: 160 },
      { year: 2022, rank: 1220, score: 529.4, quota: 160 },
      { year: 2021, rank: 1350, score: 514.8, quota: 160 }
    ]
  },
  {
    id: "104810359",
    code: "104810359",
    universityName: "HACETTEPE ÜNİVERSİTESİ",
    facultyName: "Mühendislik Fakültesi",
    departmentName: "Bilgisayar Mühendisliği",
    language: "İngilizce",
    scoreType: "SAY",
    city: "ANKARA",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 3450, score: 518.2, quota: 100 },
      { year: 2023, rank: 3800, score: 515.0, quota: 100 },
      { year: 2022, rank: 4200, score: 509.8, quota: 100 },
      { year: 2021, rank: 4600, score: 494.5, quota: 100 }
    ]
  },
  {
    id: "104810429",
    code: "104810429",
    universityName: "HACETTEPE ÜNİVERSİTESİ",
    facultyName: "Edebiyat Fakültesi",
    departmentName: "İngiliz Dili ve Edebiyatı",
    language: "İngilizce",
    scoreType: "DİL",
    city: "ANKARA",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 4200, score: 485.4, quota: 60 },
      { year: 2023, rank: 4550, score: 481.9, quota: 60 },
      { year: 2022, rank: 4900, score: 476.2, quota: 60 },
      { year: 2021, rank: 5300, score: 462.1, quota: 60 }
    ]
  },

  // --- İSTANBUL ÜNİVERSİTESİ ---
  {
    id: "105610442",
    code: "105610442",
    universityName: "İSTANBUL ÜNİVERSİTESİ",
    facultyName: "İstanbul Tıp Fakültesi (Çapa)",
    departmentName: "Tıp",
    language: "Türkçe",
    scoreType: "SAY",
    city: "İSTANBUL",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 2150, score: 526.4, quota: 290 },
      { year: 2023, rank: 2380, score: 523.5, quota: 290 },
      { year: 2022, rank: 2600, score: 519.0, quota: 290 },
      { year: 2021, rank: 2850, score: 503.2, quota: 290 }
    ]
  },
  {
    id: "105610622",
    code: "105610622",
    universityName: "İSTANBUL ÜNİVERSİTESİ",
    facultyName: "Hukuk Fakültesi",
    departmentName: "Hukuk",
    language: "Türkçe",
    scoreType: "EA",
    city: "İSTANBUL",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 3800, score: 489.1, quota: 500 },
      { year: 2023, rank: 4200, score: 485.4, quota: 500 },
      { year: 2022, rank: 4650, score: 479.8, quota: 500 },
      { year: 2021, rank: 5100, score: 465.0, quota: 500 }
    ]
  },

  // --- ANKARA ÜNİVERSİTESİ ---
  {
    id: "101110123",
    code: "101110123",
    universityName: "ANKARA ÜNİVERSİTESİ",
    facultyName: "Hukuk Fakültesi",
    departmentName: "Hukuk",
    language: "Türkçe",
    scoreType: "EA",
    city: "ANKARA",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 3200, score: 492.8, quota: 450 },
      { year: 2023, rank: 3500, score: 489.2, quota: 450 },
      { year: 2022, rank: 3900, score: 483.5, quota: 450 },
      { year: 2021, rank: 4300, score: 469.1, quota: 450 }
    ]
  },
  {
    id: "101110186",
    code: "101110186",
    universityName: "ANKARA ÜNİVERSİTESİ",
    facultyName: "Tıp Fakültesi",
    departmentName: "Tıp",
    language: "Türkçe",
    scoreType: "SAY",
    city: "ANKARA",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 3100, score: 520.4, quota: 280 },
      { year: 2023, rank: 3400, score: 517.2, quota: 280 },
      { year: 2022, rank: 3750, score: 512.0, quota: 280 },
      { year: 2021, rank: 4100, score: 496.8, quota: 280 }
    ]
  },
  {
    id: "101110292",
    code: "101110292",
    universityName: "ANKARA ÜNİVERSİTESİ",
    facultyName: "Siyasal Bilgiler Fakültesi (Mülkiye)",
    departmentName: "Siyaset Bilimi ve Kamu Yönetimi",
    scoreType: "EA",
    city: "ANKARA",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 28500, score: 428.5, quota: 100 },
      { year: 2023, rank: 31000, score: 423.8, quota: 100 },
      { year: 2022, rank: 34500, score: 417.0, quota: 100 },
      { year: 2021, rank: 38000, score: 402.1, quota: 100 }
    ]
  },

  // --- EGE ÜNİVERSİTESİ ---
  {
    id: "103410118",
    code: "103410118",
    universityName: "EGE ÜNİVERSİTESİ",
    facultyName: "Tıp Fakültesi",
    departmentName: "Tıp",
    scoreType: "SAY",
    city: "İZMİR",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 4800, score: 512.6, quota: 300 },
      { year: 2023, rank: 5200, score: 509.3, quota: 300 },
      { year: 2022, rank: 5700, score: 503.8, quota: 300 },
      { year: 2021, rank: 6200, score: 488.5, quota: 300 }
    ]
  },
  {
    id: "103410384",
    code: "103410384",
    universityName: "EGE ÜNİVERSİTESİ",
    facultyName: "Mühendislik Fakültesi",
    departmentName: "Bilgisayar Mühendisliği",
    language: "İngilizce",
    scoreType: "SAY",
    city: "İZMİR",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 11500, score: 498.4, quota: 90 },
      { year: 2023, rank: 12800, score: 494.6, quota: 90 },
      { year: 2022, rank: 14200, score: 488.9, quota: 90 },
      { year: 2021, rank: 15800, score: 473.8, quota: 90 }
    ]
  },
  {
    id: "103410512",
    code: "103410512",
    universityName: "EGE ÜNİVERSİTESİ",
    facultyName: "Diş Hekimliği Fakültesi",
    departmentName: "Diş Hekimliği",
    scoreType: "SAY",
    city: "İZMİR",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 22400, score: 484.2, quota: 140 },
      { year: 2023, rank: 24100, score: 480.5, quota: 140 },
      { year: 2022, rank: 26000, score: 474.8, quota: 140 },
      { year: 2021, rank: 28000, score: 459.2, quota: 140 }
    ]
  },

  // --- DOKUZ EYLÜL ÜNİVERSİTESİ ---
  {
    id: "103110246",
    code: "103110246",
    universityName: "DOKUZ EYLÜL ÜNİVERSİTESİ",
    facultyName: "Hukuk Fakültesi",
    departmentName: "Hukuk",
    scoreType: "EA",
    city: "İZMİR",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 12500, score: 452.8, quota: 400 },
      { year: 2023, rank: 13800, score: 448.5, quota: 400 },
      { year: 2022, rank: 15200, score: 442.0, quota: 400 },
      { year: 2021, rank: 17000, score: 426.4, quota: 400 }
    ]
  },

  // --- KATİP ÇELEBİ ÜNİVERSİTESİ ---
  {
    id: "105710012",
    code: "105710012",
    universityName: "İZMİR KATİP ÇELEBİ ÜNİVERSİTESİ",
    facultyName: "Tıp Fakültesi",
    departmentName: "Tıp",
    language: "İngilizce",
    scoreType: "SAY",
    city: "İZMİR",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 12800, score: 496.2, quota: 120 },
      { year: 2023, rank: 13900, score: 492.5, quota: 120 },
      { year: 2022, rank: 15100, score: 486.8, quota: 120 },
      { year: 2021, rank: 16800, score: 471.0, quota: 120 }
    ]
  },

  // --- YILDIZ TEKNİK ÜNİVERSİTESİ ---
  {
    id: "109610118",
    code: "109610118",
    universityName: "YILDIZ TEKNİK ÜNİVERSİTESİ",
    facultyName: "Elektrik-Elektronik Fakültesi",
    departmentName: "Bilgisayar Mühendisliği",
    language: "İngilizce",
    scoreType: "SAY",
    city: "İSTANBUL",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 2850, score: 521.8, quota: 100 },
      { year: 2023, rank: 3200, score: 518.5, quota: 100 },
      { year: 2022, rank: 3600, score: 513.0, quota: 100 },
      { year: 2021, rank: 4000, score: 497.6, quota: 100 }
    ]
  },
  {
    id: "109610145",
    code: "109610145",
    universityName: "YILDIZ TEKNİK ÜNİVERSİTESİ",
    facultyName: "Makine Fakültesi",
    departmentName: "Makine Mühendisliği",
    scoreType: "SAY",
    city: "İSTANBUL",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 16200, score: 491.5, quota: 130 },
      { year: 2023, rank: 17800, score: 487.9, quota: 130 },
      { year: 2022, rank: 19500, score: 482.0, quota: 130 },
      { year: 2021, rank: 21500, score: 466.5, quota: 130 }
    ]
  },

  // --- MARMARA ÜNİVERSİTESİ ---
  {
    id: "107210156",
    code: "107210156",
    universityName: "MARMARA ÜNİVERSİTESİ",
    facultyName: "Tıp Fakültesi",
    departmentName: "Tıp",
    language: "İngilizce",
    scoreType: "SAY",
    city: "İSTANBUL",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 4100, score: 515.2, quota: 180 },
      { year: 2023, rank: 4500, score: 511.9, quota: 180 },
      { year: 2022, rank: 4950, score: 506.2, quota: 180 },
      { year: 2021, rank: 5400, score: 490.8, quota: 180 }
    ]
  },
  {
    id: "107210342",
    code: "107210342",
    universityName: "MARMARA ÜNİVERSİTESİ",
    facultyName: "Mühendislik Fakültesi",
    departmentName: "Yazılım Mühendisliği",
    language: "İngilizce",
    scoreType: "SAY",
    city: "İSTANBUL",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 7800, score: 505.4, quota: 60 },
      { year: 2023, rank: 8700, score: 501.8, quota: 60 },
      { year: 2022, rank: 9800, score: 496.0, quota: 60 },
      { year: 2021, rank: 11000, score: 480.2, quota: 60 }
    ]
  },
  {
    id: "107210515",
    code: "107210515",
    universityName: "MARMARA ÜNİVERSİTESİ",
    facultyName: "İletişim Fakültesi",
    departmentName: "Radyo, Televizyon ve Sinema",
    scoreType: "SÖZ",
    city: "İSTANBUL",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 8400, score: 421.5, quota: 80 },
      { year: 2023, rank: 9200, score: 417.0, quota: 80 },
      { year: 2022, rank: 10200, score: 410.8, quota: 80 },
      { year: 2021, rank: 11500, score: 395.2, quota: 80 }
    ]
  },

  // --- ANADOLU ÜNİVERSİTESİ ---
  {
    id: "101010142",
    code: "101010142",
    universityName: "ANADOLU ÜNİVERSİTESİ",
    facultyName: "Eczacılık Fakültesi",
    departmentName: "Eczacılık",
    scoreType: "SAY",
    city: "ESKİŞEHİR",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 39500, score: 462.1, quota: 150 },
      { year: 2023, rank: 42000, score: 457.8, quota: 150 },
      { year: 2022, rank: 45000, score: 451.2, quota: 150 },
      { year: 2021, rank: 49000, score: 436.0, quota: 150 }
    ]
  },
  {
    id: "101010521",
    code: "101010521",
    universityName: "ANADOLU ÜNİVERSİTESİ",
    facultyName: "Güzel Sanatlar Fakültesi",
    departmentName: "Grafik Sanatlar",
    scoreType: "SÖZ",
    city: "ESKİŞEHİR",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 4,
    history: [
      { year: 2024, rank: 14200, score: 405.8, quota: 40 },
      { year: 2023, rank: 15800, score: 401.2, quota: 40 },
      { year: 2022, rank: 17500, score: 394.5, quota: 40 },
      { year: 2021, rank: 19500, score: 379.1, quota: 40 }
    ]
  },

  // --- İSTANBUL BİLGİ ÜNİVERSİTESİ ---
  {
    id: "202510115",
    code: "202510115",
    universityName: "İSTANBUL BİLGİ ÜNİVERSİTESİ",
    facultyName: "Hukuk Fakültesi",
    departmentName: "Hukuk",
    scoreType: "EA",
    city: "İSTANBUL",
    universityType: "Vakıf",
    scholarshipType: "Burslu",
    durationYears: 4,
    history: [
      { year: 2024, rank: 4200, score: 486.2, quota: 25 },
      { year: 2023, rank: 4600, score: 482.5, quota: 25 },
      { year: 2022, rank: 5100, score: 476.9, quota: 25 },
      { year: 2021, rank: 5700, score: 461.5, quota: 25 }
    ]
  },
  {
    id: "202510124",
    code: "202510124",
    universityName: "İSTANBUL BİLGİ ÜNİVERSİTESİ",
    facultyName: "Hukuk Fakültesi",
    departmentName: "Hukuk",
    scoreType: "EA",
    city: "İSTANBUL",
    universityType: "Vakıf",
    scholarshipType: "%50 İndirimli",
    durationYears: 4,
    history: [
      { year: 2024, rank: 48000, score: 402.5, quota: 120 },
      { year: 2023, rank: 52000, score: 398.1, quota: 120 },
      { year: 2022, rank: 57000, score: 391.8, quota: 120 },
      { year: 2021, rank: 63000, score: 376.2, quota: 120 }
    ]
  },

  // --- İSTANBUL AREL ÜNİVERSİTESİ (ÖN LİSANS / 2 YILLIK TYT) ---
  {
    id: "202050114",
    code: "202050114",
    universityName: "İSTANBUL AREL ÜNİVERSİTESİ",
    facultyName: "Meslek Yüksekokulu",
    departmentName: "Bilgisayar Programcılığı",
    scoreType: "TYT",
    city: "İSTANBUL",
    universityType: "Vakıf",
    scholarshipType: "Burslu",
    durationYears: 2,
    history: [
      { year: 2024, rank: 245000, score: 342.8, quota: 10 },
      { year: 2023, rank: 260000, score: 338.5, quota: 10 },
      { year: 2022, rank: 280000, score: 331.2, quota: 10 },
      { year: 2021, rank: 305000, score: 315.4, quota: 10 }
    ]
  },
  {
    id: "105650228",
    code: "105650228",
    universityName: "İSTANBUL ÜNİVERSİTESİ",
    facultyName: "Sağlık Hizmetleri Meslek Yüksekokulu",
    departmentName: "İlk ve Acil Yardım",
    scoreType: "TYT",
    city: "İSTANBUL",
    universityType: "Devlet",
    scholarshipType: "Ücretsiz",
    durationYears: 2,
    history: [
      { year: 2024, rank: 185000, score: 358.4, quota: 60 },
      { year: 2023, rank: 198000, score: 354.1, quota: 60 },
      { year: 2022, rank: 215000, score: 347.0, quota: 60 },
      { year: 2021, rank: 235000, score: 330.8, quota: 60 }
    ]
  }
];
