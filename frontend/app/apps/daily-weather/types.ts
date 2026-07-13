export interface DailyWeatherSnapshot {
  city: string;
  dateLabel: string;
  condition: string;
  tempC: number;
  tempMinC: number;
  tempMaxC: number;
  humidity: number;
  windKmh: number;
  icon: "sun" | "cloud" | "rain" | "partly" | "snow";
  maxPrecipitationProbability?: number;
  eveningTempC?: number;
  eveningPrecipitationProbability?: number;
  hourlyData?: {
    time: string;
    tempC: number;
    precipProb: number;
    weatherCode: number;
  }[];
  dailyForecast?: {
    dayLabel: string;
    dateLabel: string;
    condition: string;
    tempC: number;
    tempMinC: number;
    tempMaxC: number;
    humidity: number;
    windKmh: number;
    maxPrecipitationProbability: number;
    icon: "sun" | "cloud" | "rain" | "partly" | "snow";
    weatherCode: number;
    hourlyData: {
      time: string;
      tempC: number;
      precipProb: number;
      weatherCode: number;
    }[];
  }[];
}
