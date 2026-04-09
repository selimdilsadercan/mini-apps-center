export function getSeriesData(id: string) {
  if (typeof window === 'undefined') return { watchedEpisodes: [], rating: null, inWatchlist: false };
  const data = localStorage.getItem(`series_${id}`);
  return data ? JSON.parse(data) : { watchedEpisodes: [], rating: null, inWatchlist: false };
}

export function saveSeriesData(id: string, data: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`series_${id}`, JSON.stringify(data));
}

export function toggleWatchlist(id: string) {
  const data = getSeriesData(id);
  data.inWatchlist = !data.inWatchlist;
  saveSeriesData(id, data);
}

export function setRating(id: string, rating: number) {
  const data = getSeriesData(id);
  data.rating = rating;
  saveSeriesData(id, data);
}

export function toggleEpisodeWatched(id: string, episodeId: string) {
  const data = getSeriesData(id);
  if (data.watchedEpisodes.includes(episodeId)) {
    data.watchedEpisodes = data.watchedEpisodes.filter((eid: string) => eid !== episodeId);
  } else {
    data.watchedEpisodes.push(episodeId);
  }
  saveSeriesData(id, data);
}

export function getUserStore() {
  if (typeof window === 'undefined') return {};
  const allData: any = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('series_')) {
      const id = key.replace('series_', '');
      allData[id] = JSON.parse(localStorage.getItem(key) || '{}');
    }
  }
  return allData;
}

export function getWatchProgress(id: string, totalEpisodes: number) {
  if (totalEpisodes === 0) return 0;
  const data = getSeriesData(id);
  return Math.round((data.watchedEpisodes.length / totalEpisodes) * 100);
}
