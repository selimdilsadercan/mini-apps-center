import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

export interface SustainabilityStats {
    userTotalPoints: number;
    userMonthPoints: number;
}

export interface GetStatsRequest {
    userId: string;
}

// Get user and community stats for sustainability
export const getStats = api(
    { expose: true, method: "GET", path: "/surdurulebilirlik/stats/:userId" },
    async ({ userId }: GetStatsRequest): Promise<SustainabilityStats> => {
        const { data, error } = await supabase.rpc("get_sustainability_stats", {
            p_user_id: userId
        });
        
        if (error) {
            throw APIError.internal(`Supabase error: ${error.message}`);
        }
        
        const stats = data?.[0] || { 
            user_total_points: 0, 
            user_month_points: 0 
        };
        
        return {
            userTotalPoints: Number(stats.user_total_points),
            userMonthPoints: Number(stats.user_month_points)
        };
    }
);
