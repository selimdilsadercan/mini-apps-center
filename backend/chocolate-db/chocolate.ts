import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

export interface Chocolate {
    id: string;
    name: string;
    brand: string;
    description: string | null;
    image_url: string | null;
    avg_rating: number;
    review_count: number;
}

export interface ListChocolatesResponse {
    chocolates: Chocolate[];
}

export interface Review {
    id: string;
    chocolate_id: string;
    rating: number;
    comment: string | null;
    reviewer_name: string | null;
    created_at: string;
}

export interface ChocolateDetail extends Chocolate {
    reviews: Review[];
}

// List all chocolates using Supabase RPC
export const listChocolates = api(
    { expose: true, method: "GET", path: "/chocolate" },
    async (): Promise<ListChocolatesResponse> => {
        const { data, error } = await supabase
            .schema("chocolate_db")
            .rpc("get_chocolates");

        if (error) {
            throw APIError.internal(`Failed to fetch chocolates: ${error.message}`);
        }

        return { 
            chocolates: (data || []).map((c: any) => ({
                ...c,
                avg_rating: Number(c.avg_rating)
            })) 
        };
    }
);

// Get single chocolate details using Supabase RPC
export const getChocolate = api(
    { expose: true, method: "GET", path: "/chocolate/:id" },
    async ({ id }: { id: string }): Promise<ChocolateDetail> => {
        const { data, error } = await supabase
            .schema("chocolate_db")
            .rpc("get_chocolate_detail", { p_id: id });

        if (error) {
            throw APIError.internal(`Failed to fetch chocolate detail: ${error.message}`);
        }

        const row = data?.[0];
        if (!row) throw APIError.notFound("chocolate not found");

        return {
            id: row.id,
            name: row.name,
            brand: row.brand,
            description: row.description,
            image_url: row.image_url,
            avg_rating: Number(row.avg_rating),
            review_count: row.review_count,
            reviews: row.reviews as Review[],
        };
    }
);

export interface AddReviewRequest {
    chocolate_id: string;
    rating: number;
    comment?: string;
    reviewer_name?: string;
}

export interface ImportProduct {
    name: string;
    brand: string;
    image_url: string;
    description?: string;
}

export interface ImportProductsRequest {
    products: ImportProduct[];
}

// Bulk import chocolates
export const importProducts = api(
    { expose: true, method: "POST", path: "/chocolate/import" },
    async (req: ImportProductsRequest): Promise<{ count: number }> => {
        let count = 0;
        for (const product of req.products) {
            const { error } = await supabase
                .schema("chocolate_db")
                .from("chocolates")
                .upsert({
                    name: product.name,
                    brand: product.brand,
                    description: product.description || null,
                    image_url: product.image_url
                }, { onConflict: "name" });
            
            if (!error) count++;
            else console.error(`Failed to import ${product.name}:`, error.message);
        }
        return { count };
    }
);

// Add a review using Supabase RPC
export const addReview = api(
    { expose: true, method: "POST", path: "/chocolate/review" },
    async (params: AddReviewRequest): Promise<{ success: boolean }> => {
        const { error } = await supabase
            .schema("chocolate_db")
            .rpc("add_review", {
                p_chocolate_id: params.chocolate_id,
                p_rating: params.rating,
                p_comment: params.comment || null,
                p_reviewer_name: params.reviewer_name || "Anonim"
            });

        if (error) {
            throw APIError.internal(`Failed to add review: ${error.message}`);
        }

        return { success: true };
    }
);

// Admin/Utility: Seed initial data (Keep direct SQL for admin tasks if needed, or move to RPC)
export const seedChocolates = api(
    { expose: true, method: "POST", path: "/chocolate/seed" },
    async (): Promise<{ count: number }> => {
        const initialChocolates = [
            { name: "Dido", brand: "Ülker", description: "Sütlü Çikolatalı Gofret", image_url: "https://st2.depositphotos.com/1000423/11624/i/450/depositphotos_116244580-stock-photo-ulker-dido-chocolate-wafer.jpg" },
            { name: "Albeni", brand: "Ülker", description: "Karamelli Bisküvili Çikolata", image_url: "https://st2.depositphotos.com/1000423/11624/i/450/depositphotos_116244582-stock-photo-ulker-albeni-chocolate-bar.jpg" },
            { name: "Tadelle", brand: "Sarelle", description: "Fındık Dolgulu Sütlü Çikolata", image_url: "https://st2.depositphotos.com/1000423/11624/i/450/depositphotos_116244584-stock-photo-tadelle-chocolate-bar.jpg" },
            { name: "Karam", brand: "Eti", description: "%54 Kakaolu Bitter Çikolata", image_url: "https://st2.depositphotos.com/1000423/11624/i/450/depositphotos_116244586-stock-photo-eti-karam-chocolate-bar.jpg" },
        ];

        for (const choco of initialChocolates) {
            // Direct insert via Supabase for seeding
            const { error } = await supabase
                .schema("chocolate_db")
                .from("chocolates")
                .upsert({
                    name: choco.name,
                    brand: choco.brand,
                    description: choco.description,
                    image_url: choco.image_url
                }, { onConflict: "name" });
            
            if (error) console.error(`Failed to seed ${choco.name}:`, error.message);
        }

        return { count: initialChocolates.length };
    }
);
