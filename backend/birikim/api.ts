import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import axios from "axios";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: string; // 'cash', 'bank_account', 'gold', 'foreign_currency', 'other', 'sukuk', 'stock', 'fund'
  balance: number;
  currency: string;
  purchase_date?: string | null;
  created_at: string;
}

export interface Target {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  target_date: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  account_name: string | null;
  target_id: string | null;
  target_title: string | null;
  amount: number;
  type: string; // 'deposit', 'withdraw', 'target_allocation', 'target_refund'
  description: string | null;
  created_at: string;
}

// ==================== REQ/RES INTERFACES ====================

export interface GetBirikimDataRequest {
  userId: string;
}

export interface GetBirikimDataResponse {
  accounts: Account[];
  targets: Target[];
  transactions: Transaction[];
}

export interface UpsertAccountRequest {
  id?: string; // If provided, updates existing; otherwise creates new
  userId: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  purchaseDate?: string;
}

export interface UpsertAccountResponse {
  success: boolean;
  accountId: string;
}

export interface DeleteAccountRequest {
  id: string;
  userId: string;
}

export interface DeleteAccountResponse {
  success: boolean;
}

export interface UpsertTargetRequest {
  id?: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate?: string;
}

export interface UpsertTargetResponse {
  success: boolean;
  targetId: string;
}

export interface DeleteTargetRequest {
  id: string;
  userId: string;
}

export interface DeleteTargetResponse {
  success: boolean;
}

export interface AddTransactionRequest {
  userId: string;
  accountId?: string;
  targetId?: string;
  amount: number;
  type: string;
  description?: string;
}

export interface AddTransactionResponse {
  success: boolean;
  transactionId: string;
}

// ==================== ENDPOINTS ====================

/**
 * Fetches all savings data for a user (accounts, targets, transaction history)
 */
export const getBirikimData = api(
  { expose: true, method: "GET", path: "/birikim/data/:userId" },
  async ({ userId }: GetBirikimDataRequest): Promise<GetBirikimDataResponse> => {
    // 1. Get accounts
    const { data: accountsData, error: accountsError } = await supabase
      .schema("birikim")
      .rpc("get_accounts", { p_user_id: userId });

    if (accountsError) {
      console.error("get_accounts error:", accountsError);
      throw APIError.internal(`Failed to load savings accounts: ${accountsError.message}`);
    }

    // 2. Get targets
    const { data: targetsData, error: targetsError } = await supabase
      .schema("birikim")
      .rpc("get_targets", { p_user_id: userId });

    if (targetsError) {
      console.error("get_targets error:", targetsError);
      throw APIError.internal(`Failed to load savings targets: ${targetsError.message}`);
    }

    // 3. Get transactions
    const { data: txData, error: txError } = await supabase
      .schema("birikim")
      .rpc("get_transactions", { p_user_id: userId, p_limit: 50 });

    if (txError) {
      console.error("get_transactions error:", txError);
      throw APIError.internal(`Failed to load transaction history: ${txError.message}`);
    }

    return {
      accounts: accountsData || [],
      targets: targetsData || [],
      transactions: txData || [],
    };
  }
);

/**
 * Creates or updates a savings account
 */
export const upsertAccount = api(
  { expose: true, method: "POST", path: "/birikim/account" },
  async (req: UpsertAccountRequest): Promise<UpsertAccountResponse> => {
    const { data, error } = await supabase
      .schema("birikim")
      .rpc("upsert_account", {
        p_id: req.id || null,
        p_user_id: req.userId,
        p_name: req.name,
        p_type: req.type,
        p_balance: req.balance,
        p_currency: req.currency,
        p_purchase_date: req.purchaseDate || null,
      });

    if (error) {
      console.error("upsert_account error:", error);
      throw APIError.internal(`Failed to save account: ${error.message}`);
    }

    return {
      success: !!data,
      accountId: data || "",
    };
  }
);

/**
 * Deletes a savings account
 */
export const deleteAccount = api(
  { expose: true, method: "DELETE", path: "/birikim/account/:id" },
  async ({ id, userId }: DeleteAccountRequest): Promise<DeleteAccountResponse> => {
    const { data, error } = await supabase
      .schema("birikim")
      .rpc("delete_account", {
        p_id: id,
        p_user_id: userId,
      });

    if (error) {
      console.error("delete_account error:", error);
      throw APIError.internal(`Failed to delete account: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Creates or updates a savings target
 */
export const upsertTarget = api(
  { expose: true, method: "POST", path: "/birikim/target" },
  async (req: UpsertTargetRequest): Promise<UpsertTargetResponse> => {
    const { data, error } = await supabase
      .schema("birikim")
      .rpc("upsert_target", {
        p_id: req.id || null,
        p_user_id: req.userId,
        p_title: req.title,
        p_target_amount: req.targetAmount,
        p_current_amount: req.currentAmount,
        p_currency: req.currency,
        p_target_date: req.targetDate || null,
      });

    if (error) {
      console.error("upsert_target error:", error);
      throw APIError.internal(`Failed to save savings target: ${error.message}`);
    }

    return {
      success: !!data,
      targetId: data || "",
    };
  }
);

/**
 * Deletes a savings target
 */
export const deleteTarget = api(
  { expose: true, method: "DELETE", path: "/birikim/target/:id" },
  async ({ id, userId }: DeleteTargetRequest): Promise<DeleteTargetResponse> => {
    const { data, error } = await supabase
      .schema("birikim")
      .rpc("delete_target", {
        p_id: id,
        p_user_id: userId,
      });

    if (error) {
      console.error("delete_target error:", error);
      throw APIError.internal(`Failed to delete savings target: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Logs a new transaction and automatically adjusts account/target balances
 */
export const addTransaction = api(
  { expose: true, method: "POST", path: "/birikim/transaction" },
  async (req: AddTransactionRequest): Promise<AddTransactionResponse> => {
    const { data, error } = await supabase
      .schema("birikim")
      .rpc("add_transaction", {
        p_user_id: req.userId,
        p_account_id: req.accountId || null,
        p_target_id: req.targetId || null,
        p_amount: req.amount,
        p_type: req.type,
        p_description: req.description || null,
      });

    if (error) {
      console.error("add_transaction error:", error);
      throw APIError.internal(`Failed to log transaction: ${error.message}`);
    }

    return {
      success: !!data,
      transactionId: data || "",
    };
  }
);

// ==================== SUKUK INSTRUMENTS ENDPOINT ====================

export interface SukukInstrument {
  isin: string;
  name: string;
  type: string;
  currency: string;
  maturityDate: string;
  paymentFrequencyMonths: number;
  rentRatePerPeriod: number;
  annualSimpleRate: number;
  referencePrice: number;
  priceSource: string;
  instrumentSource: string;
  updatedAt: string;
}

export interface GetSukukInstrumentsResponse {
  instruments: SukukInstrument[];
}

/**
 * Fetches the active lease certificate catalog
 */
export const getSukukInstruments = api(
  { expose: true, method: "GET", path: "/birikim/sukuk-instruments" },
  async (): Promise<GetSukukInstrumentsResponse> => {
    const { data, error } = await supabase
      .schema("birikim")
      .rpc("get_sukuk_instruments");

    const instruments: SukukInstrument[] = (data || []).map((s: any) => ({
      isin: s.isin,
      name: s.name,
      type: s.type,
      currency: s.currency,
      maturityDate: s.maturity_date,
      paymentFrequencyMonths: s.payment_frequency_months,
      rentRatePerPeriod: Number(s.rent_rate_per_period),
      annualSimpleRate: Number(s.annual_simple_rate),
      referencePrice: Number(s.reference_price),
      priceSource: s.price_source,
      instrumentSource: s.instrument_source,
      updatedAt: s.updated_at,
    }));

    return { instruments };
  }
);

// ==================== HELPER SCRAPERS & FETCHERS ====================

async function fetchYahooStockPrice(symbol: string) {
  const cleanSymbol = symbol.toUpperCase().trim();
  const ticker = cleanSymbol.endsWith(".IS") ? cleanSymbol : `${cleanSymbol}.IS`;
  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      timeout: 5000
    });
    const result = response.data?.chart?.result?.[0];
    if (result) {
      const meta = result.meta;
      return {
        symbol: cleanSymbol,
        price: Number(meta.regularMarketPrice) || 0,
        name: meta.shortName || cleanSymbol,
        currency: meta.currency || "TRY",
        date: new Date(meta.regularMarketTime * 1000).toISOString().split("T")[0]
      };
    }
  } catch (err) {
    console.error(`Yahoo Finance fetch failed for ${ticker}:`, err);
  }
  return null;
}

async function fetchTefasDailyPrices() {
  const now = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;
    const dateDash = `${year}-${month}-${day}`;
    
    try {
      const response = await axios.post("https://www.tefas.gov.tr/api/funds/fonGnlBlgSiraliGetir", {
        fonTipi: "YAT",
        fonKodu: null,
        aramaMetni: null,
        fonTurKod: null,
        fonGrubu: null,
        sfonTurKod: null,
        fonTurAciklama: null,
        kurucuKod: null,
        basTarih: dateStr,
        bitTarih: dateStr,
        basSira: 1,
        bitSira: 100000,
        dil: "TR",
        sFonTurKod: "",
        fonKod: "",
        fonGrup: "",
        fonUnvanTip: ""
      }, {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://www.tefas.gov.tr/tr/fon-verileri",
          "Origin": "https://www.tefas.gov.tr"
        },
        timeout: 5000
      });
      const list = response.data?.resultList;
      if (list && Array.isArray(list) && list.length > 0) {
        return { data: list, date: dateDash };
      }
    } catch (err) {
      // Try previous day
    }
  }
  return null;
}

async function fetchYahooFxRate(symbol: string): Promise<number | null> {
  const pair = symbol === "USD" ? "USDTRY=X" : symbol === "EUR" ? "EURTRY=X" : symbol === "GBP" ? "GBPTRY=X" : `${symbol}TRY=X`;
  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${pair}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      timeout: 5000
    });
    return Number(response.data?.chart?.result?.[0]?.meta?.regularMarketPrice) || null;
  } catch (err) {
    console.error(`FX fetch failed for ${pair}:`, err);
    return null;
  }
}

// ==================== SEARCH & PRICE ENDPOINTS ====================

export interface UnifiedSearchInstrument {
  symbol: string;
  name: string;
  price: number;
  assetType: string;
  currency: string;
  priceDate: string;
  priceDelay: string;
  source: string;
  maturityDate?: string;
  periodicRate?: number;
  paymentFrequencyMonths?: number;
}

export interface SearchInstrumentsRequest {
  query: string;
  assetType: string;
}

export interface SearchInstrumentsResponse {
  results: UnifiedSearchInstrument[];
}

export const searchInstruments = api(
  { expose: true, method: "POST", path: "/birikim/search-instruments" },
  async (req: SearchInstrumentsRequest): Promise<SearchInstrumentsResponse> => {
    const query = req.query.trim();
    if (!query) return { results: [] };

    if (req.assetType === "stock") {
      const stock = await fetchYahooStockPrice(query);
      if (stock) {
        return {
          results: [{
            symbol: stock.symbol,
            name: stock.name,
            price: stock.price,
            assetType: "stock",
            currency: stock.currency,
            priceDate: stock.date,
            priceDelay: "15_min",
            source: "Yahoo Finance"
          }]
        };
      }
    } else if (req.assetType === "fund") {
      const tefas = await fetchTefasDailyPrices();
      if (tefas) {
        const matches = tefas.data.filter((f: any) =>
          (f.fonKodu || "").toLowerCase().includes(query.toLowerCase()) ||
          (f.fonUnvan || "").toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
        return {
          results: matches.map((f: any) => ({
            symbol: f.fonKodu,
            name: `${f.fonKodu} - ${f.fonUnvan}`,
            price: Number(f.fiyat) || 0,
            assetType: "fund",
            currency: "TRY",
            priceDate: tefas.date,
            priceDelay: "end_of_day",
            source: "TEFAS"
          }))
        };
      }
    } else if (req.assetType === "sukuk") {
      const { data, error } = await supabase
        .schema("birikim")
        .rpc("get_sukuk_instruments");
      if (error) {
        console.error("get_sukuk_instruments error:", error);
      } else {
        const matches = (data || []).filter((s: any) =>
          s.isin.toLowerCase().includes(query.toLowerCase()) ||
          s.name.toLowerCase().includes(query.toLowerCase())
        );
        return {
          results: matches.map((s: any) => ({
            symbol: s.isin,
            name: s.name,
            price: Number(s.reference_price) || 0,
            assetType: "sukuk",
            currency: s.currency,
            priceDate: new Date(s.updated_at).toISOString().split("T")[0],
            priceDelay: "end_of_day",
            source: s.price_source,
            maturityDate: s.maturity_date,
            periodicRate: Number(s.rent_rate_per_period),
            paymentFrequencyMonths: s.payment_frequency_months
          }))
        };
      }
    }

    return { results: [] };
  }
);

export interface GetUnifiedPriceRequest {
  symbol: string;
  assetType: string;
}

export interface GetUnifiedPriceResponse {
  price: number;
  name: string;
  priceDate: string;
  priceDelay: string;
  currency: string;
  source: string;
  maturityDate?: string;
  periodicRate?: number;
  paymentFrequencyMonths?: number;
}

export const getUnifiedPrice = api(
  { expose: true, method: "POST", path: "/birikim/unified-price" },
  async (req: GetUnifiedPriceRequest): Promise<GetUnifiedPriceResponse> => {
    const symbol = req.symbol.trim();

    if (req.assetType === "stock") {
      const stock = await fetchYahooStockPrice(symbol);
      if (stock) {
        return {
          price: stock.price,
          name: stock.name,
          priceDate: stock.date,
          priceDelay: "15_min",
          currency: stock.currency,
          source: "Yahoo Finance"
        };
      }
    } else if (req.assetType === "fund") {
      const tefas = await fetchTefasDailyPrices();
      if (tefas) {
        const match = tefas.data.find((f: any) => (f.fonKodu || "").toUpperCase() === symbol.toUpperCase());
        if (match) {
          return {
            price: Number(match.fiyat) || 0,
            name: match.fonUnvan,
            priceDate: tefas.date,
            priceDelay: "end_of_day",
            currency: "TRY",
            source: "TEFAS"
          };
        }
      }
    } else if (req.assetType === "sukuk") {
      const { data, error } = await supabase
        .schema("birikim")
        .from("sukuk_instruments")
        .select("*")
        .eq("isin", symbol)
        .maybeSingle();

      if (error) {
        console.error("fetch sukuk error:", error);
      } else if (data) {
        return {
          price: Number(data.reference_price) || 0,
          name: data.name,
          priceDate: new Date(data.updated_at).toISOString().split("T")[0],
          priceDelay: "end_of_day",
          currency: data.currency,
          source: data.price_source,
          maturityDate: data.maturity_date,
          periodicRate: Number(data.rent_rate_per_period),
          paymentFrequencyMonths: data.payment_frequency_months
        };
      }
    } else if (req.assetType === "gold") {
      if (symbol === "GOLD_GRAM") {
        const usdTry = await fetchYahooFxRate("USD") || 33.0;
        const goldOunceUsd = await fetchYahooFxRate("GC=F") || 2400.0;
        const gramGoldTry = (goldOunceUsd / 31.1035) * usdTry;
        return {
          price: gramGoldTry,
          name: "Gram Altın",
          priceDate: new Date().toISOString().split("T")[0],
          priceDelay: "15_min",
          currency: "GOLD",
          source: "Yahoo Finance"
        };
      } else {
        const usdTry = await fetchYahooFxRate("USD") || 33.0;
        const goldOunceUsd = await fetchYahooFxRate("GC=F") || 2400.0;
        const gramGoldTry = (goldOunceUsd / 31.1035) * usdTry;

        const multipliers: Record<string, number> = {
          GOLD_CEYREK: 1.75,
          GOLD_YARIM: 3.5,
          GOLD_TAM: 7.0,
          SILVER_GRAM: 0.013
        };

        const mult = multipliers[symbol] || 1.0;
        const names: Record<string, string> = {
          GOLD_CEYREK: "Çeyrek Altın",
          GOLD_YARIM: "Yarım Altın",
          GOLD_TAM: "Tam Altın",
          SILVER_GRAM: "Gram Gümüş"
        };

        return {
          price: gramGoldTry * mult,
          name: names[symbol] || symbol,
          priceDate: new Date().toISOString().split("T")[0],
          priceDelay: "15_min",
          currency: "TRY",
          source: "Calculated"
        };
      }
    } else if (req.assetType === "foreign_currency") {
      const rate = await fetchYahooFxRate(symbol);
      if (rate) {
        return {
          price: rate,
          name: `${symbol} Döviz`,
          priceDate: new Date().toISOString().split("T")[0],
          priceDelay: "15_min",
          currency: symbol,
          source: "Yahoo Finance"
        };
      }
    }

    throw APIError.notFound("Instrument not found");
  }
);
