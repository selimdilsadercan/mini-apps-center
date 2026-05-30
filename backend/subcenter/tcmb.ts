import { APIError } from "encore.dev/api";

const TCMB_TODAY_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";
const CACHE_TTL_MS = 30 * 60 * 1000;

export interface TcmbExchangeRate {
  from: "USD";
  to: "TRY";
  rate: number;
  source: "tcmb";
  rateType: "forex_selling";
  date: string;
  fetchedAt: string;
}

let cachedRate: TcmbExchangeRate | null = null;
let cachedAt = 0;

function parseTcmbNumber(value: string): number {
  return parseFloat(value.trim().replace(",", "."));
}

function parseUsdForexSelling(xml: string): { rate: number; date: string } | null {
  const dateMatch = xml.match(/<Tarih_Date[^>]*Tarih="([^"]+)"/);
  const currencyBlock = xml.match(/<Currency[^>]*Kod="USD"[^>]*>[\s\S]*?<\/Currency>/);
  if (!currencyBlock) return null;

  const block = currencyBlock[0];
  const unitMatch = block.match(/<Unit>(\d+)<\/Unit>/);
  const sellingMatch = block.match(/<ForexSelling>([\d.,]+)<\/ForexSelling>/);
  if (!sellingMatch) return null;

  const unit = unitMatch ? parseInt(unitMatch[1], 10) : 1;
  const selling = parseTcmbNumber(sellingMatch[1]);
  if (!Number.isFinite(selling) || unit <= 0) return null;

  return {
    rate: selling / unit,
    date: dateMatch?.[1] ?? new Date().toISOString().slice(0, 10),
  };
}

export async function getUsdTryRateFromTcmb(): Promise<TcmbExchangeRate> {
  const now = Date.now();
  if (cachedRate && now - cachedAt < CACHE_TTL_MS) {
    return cachedRate;
  }

  const response = await fetch(TCMB_TODAY_URL, {
    headers: { Accept: "application/xml,text/xml,*/*" },
  });

  if (!response.ok) {
    if (cachedRate) return cachedRate;
    throw APIError.internal(`TCMB request failed: ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parseUsdForexSelling(xml);
  if (!parsed) {
    if (cachedRate) return cachedRate;
    throw APIError.internal("USD rate not found in TCMB response");
  }

  cachedRate = {
    from: "USD",
    to: "TRY",
    rate: parsed.rate,
    source: "tcmb",
    rateType: "forex_selling",
    date: parsed.date,
    fetchedAt: new Date().toISOString(),
  };
  cachedAt = now;

  return cachedRate;
}
