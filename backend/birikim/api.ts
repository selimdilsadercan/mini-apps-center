import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: string; // 'cash', 'bank_account', 'gold', 'foreign_currency', 'other'
  balance: number;
  currency: string;
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
