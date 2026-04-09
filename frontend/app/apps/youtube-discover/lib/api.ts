import { Series } from "./types";

const MOCK_SERIES: Series[] = [
  {
    id: "1",
    title: "Katarsis",
    description: "Gökhan Çınar'ın sunumuyla, hayat hikayelerini ve derin duyguları keşfedin.",
    creator: "Bana Göz Kulak Ol",
    youtubeId: "vC06f7B3qfU",
    category: "talk-show",
    status: "devam-ediyor",
    year: 2023,
    episodeCount: 120,
    avgRating: 4.8,
    ratingCount: 1540,
    gradient: "from-purple-900 via-indigo-900 to-black"
  },
  {
    id: "2",
    title: "Evrim Ağacı",
    description: "Bilim, felsefe ve teknoloji üzerine derinlemesine analizler.",
    creator: "Çağrı Mert Bakırcı",
    youtubeId: "J87LnyS7SRA",
    category: "bilim",
    status: "devam-ediyor",
    year: 2024,
    episodeCount: 450,
    avgRating: 4.9,
    ratingCount: 5200,
    gradient: "from-cyan-900 via-blue-900 to-black"
  },
  {
    id: "3",
    title: "Enis Kirazoğlu",
    description: "Oyun dünyasından haberler, incelemeler ve keyifli sohbetler.",
    creator: "Enis Kirazoğlu",
    youtubeId: "L8S7n4rZ-X4",
    category: "oyun",
    status: "devam-ediyor",
    year: 2024,
    episodeCount: 380,
    avgRating: 4.7,
    ratingCount: 8900,
    gradient: "from-red-900 via-purple-900 to-black"
  },
  {
      id: "4",
      title: "Filme Gel",
      description: "Film önerileri, analizler ve sinema dünyasına dair her şey.",
      creator: "Filme Gel",
      youtubeId: "yXqA9MhSg3I",
      category: "eglence",
      status: "devam-ediyor",
      year: 2023,
      episodeCount: 85,
      avgRating: 4.5,
      ratingCount: 420,
      gradient: "from-amber-900 via-orange-900 to-black"
  }
];

let GLOBAL_MOCK_SERIES = [...MOCK_SERIES];
let GLOBAL_MOCK_VIDEOS: any[] = [];

export async function fetchSeries(): Promise<Series[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(GLOBAL_MOCK_SERIES), 100);
  });
}

export async function fetchSeriesById(id: string): Promise<Series | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const series = GLOBAL_MOCK_SERIES.find(s => s.id === id);
      if (series) {
        const episodes = Array.from({ length: series.episodeCount > 10 ? 10 : series.episodeCount }, (_, i) => ({
          id: `ep_${id}_${i + 1}`,
          title: `${series.title} - Bölüm ${i + 1}`,
          episodeNumber: i + 1,
          duration: "45:00",
          youtubeId: series.youtubeId
        }));
        resolve({ ...series, episodes, tags: ["Popüler", "Yeni", series.category] });
      } else {
        resolve(null);
      }
    }, 100);
  });
}

export async function createSeries(data: any): Promise<Series> {
    const newSeries = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        episodeCount: data.episodes?.length || 0,
        avgRating: 0,
        ratingCount: 0,
        gradient: data.gradient || "from-slate-900 to-black"
    };
    GLOBAL_MOCK_SERIES.push(newSeries);
    return newSeries;
}

export async function deleteSeries(id: string): Promise<void> {
    GLOBAL_MOCK_SERIES = GLOBAL_MOCK_SERIES.filter(s => s.id !== id);
}

export async function fetchVideos(): Promise<any[]> {
    return GLOBAL_MOCK_VIDEOS;
}

export async function createVideo(data: any): Promise<any> {
    const newVideo = {
        ...data,
        id: Math.floor(Math.random() * 10000),
        title: "Youtube Videosu",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
    };
    GLOBAL_MOCK_VIDEOS.push(newVideo);
    return newVideo;
}

export async function deleteVideo(id: number): Promise<void> {
    GLOBAL_MOCK_VIDEOS = GLOBAL_MOCK_VIDEOS.filter(v => v.id !== id);
}

export async function linkVideoToSeries(videoId: number, seriesId: string, episodeNumber: number): Promise<void> {
    const series = GLOBAL_MOCK_SERIES.find(s => s.id === seriesId);
    if (series) {
        if (!series.episodes) series.episodes = [];
        series.episodes.push({
            id: `ep_${videoId}`,
            title: `Bölüm ${episodeNumber}`,
            episodeNumber,
            duration: "10:00",
            youtubeId: "dQw4w9WgXcQ"
        });
        series.episodeCount = series.episodes.length;
    }
}
