import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

export interface StatsResponse {
    userTotalSavings: number;
    userMonthSavings: number;
}

export interface GetStatsRequest {
    userId: string;
}

// Get user and community stats
export const getStats = api(
    { expose: true, method: "GET", path: "/tasarruf-challenges/stats/:userId" },
    async ({ userId }: GetStatsRequest): Promise<StatsResponse> => {
        const { data, error } = await supabase.schema("tasarruf_challenges").rpc("get_stats", {
            p_user_id: userId
        });
        
        if (error) {
            throw APIError.internal(`Supabase error: ${error.message}`);
        }
        
        const stats = data?.[0] || { 
            user_total_savings: 0, 
            user_month_savings: 0 
        };
        
        return {
            userTotalSavings: Number(stats.user_total_savings),
            userMonthSavings: Number(stats.user_month_savings)
        };
    }
);


