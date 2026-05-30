import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import productsData from "./data/products.json";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

export interface Chocolate {
    id: string;
    name: string;
    brand: string;
    description_tr: string | null;
    description_en: string | null;
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

interface RawProduct {
    name: string;
    price?: string;
    weight?: string;
    image_url: string;
}

// Slugify function to generate stable slug IDs from product names
function slugify(text: string): string {
    const trMap: { [key: string]: string } = {
        'ç': 'c', 'g': 'g', 'ğ': 'g', 'ı': 'i', 'i': 'i', 'o': 'o', 'ö': 'o',
        's': 's', 'ş': 's', 'u': 'u', 'ü': 'u', 'Ç': 'C', 'Ğ': 'G', 'İ': 'I',
        'Ö': 'O', 'Ş': 'S', 'Ü': 'U'
    };
    for (const key in trMap) {
        text = text.replace(new RegExp(key, 'g'), trMap[key]);
    }
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 -]/g, '')     // Remove invalid chars
        .replace(/\s+/g, '-')           // Collapse whitespace and replace by -
        .replace(/-+/g, '-');           // Collapse dashes
}

// Load products list directly from the local JSON file
function loadProducts(): Chocolate[] {
    const seen = new Set<string>();
    const list: Chocolate[] = [];
    
    for (const p of productsData as RawProduct[]) {
        const id = slugify(p.name);
        if (seen.has(id)) {
            continue;
        }
        seen.add(id);
        
        let brand = "Diğer";
        const nameLower = p.name.toLowerCase();
        if (nameLower.startsWith("ülker")) brand = "Ülker";
        else if (nameLower.startsWith("eti")) brand = "Eti";
        else if (nameLower.startsWith("nestle") || nameLower.startsWith("nestlé")) brand = "Nestlé";
        else if (nameLower.startsWith("kahve dünyası")) brand = "Kahve Dünyası";
        else if (nameLower.startsWith("milka")) brand = "Milka";
        else if (nameLower.startsWith("sarelle")) brand = "Sarelle";
        else if (nameLower.startsWith("kinder")) brand = "Kinder";
        else if (nameLower.startsWith("schar")) brand = "Schär";
        else if (nameLower.startsWith("dido")) brand = "Ülker";
        else {
            const firstWord = p.name.split(" ")[0];
            if (firstWord) brand = firstWord;
        }
        
        const descTr = `${p.weight || ""} ${p.price || ""}`.trim();
        const descEn = `${p.weight || ""} Chocolate Snack`.trim();
        
        list.push({
            id: id,
            name: p.name,
            brand: brand,
            description_tr: descTr || "Lezzetli çikolata atıştırmalığı.",
            description_en: descEn || "Delicious chocolate snack.",
            image_url: p.image_url,
            avg_rating: 0,
            review_count: 0
        });
    }
    
    return list;
}

// List all chocolates (loaded from file + rating/reviews statistics from DB)
export const listChocolates = api(
    { expose: true, method: "GET", path: "/chocolate" },
    async (): Promise<ListChocolatesResponse> => {
        const chocolates = loadProducts();
        
        const { data, error } = await supabase
            .schema("chocolate_db")
            .rpc("get_chocolates");
            
        if (error) {
            console.error("Failed to fetch reviews summary:", error.message);
            return { chocolates };
        }

        const statsMap = new Map<string, { avg_rating: number, review_count: number }>();
        if (data) {
            for (const row of data) {
                statsMap.set(row.chocolate_id, {
                    avg_rating: Number(row.avg_rating),
                    review_count: Number(row.review_count)
                });
            }
        }

        const mergedChocolates = chocolates.map(choco => {
            const stats = statsMap.get(choco.id);
            return {
                ...choco,
                avg_rating: stats ? stats.avg_rating : 0,
                review_count: stats ? stats.review_count : 0
            };
        });

        mergedChocolates.sort((a, b) => {
            if (b.avg_rating !== a.avg_rating) {
                return b.avg_rating - a.avg_rating;
            }
            return a.name.localeCompare(b.name);
        });

        return { chocolates: mergedChocolates };
    }
);

// Get single chocolate details (loaded from local list + full reviews from DB)
export const getChocolate = api(
    { expose: true, method: "GET", path: "/chocolate/:id" },
    async ({ id }: { id: string }): Promise<ChocolateDetail> => {
        const chocolates = loadProducts();
        const choco = chocolates.find(c => c.id === id);
        if (!choco) {
            throw APIError.notFound("chocolate not found");
        }

        const { data, error } = await supabase
            .schema("chocolate_db")
            .rpc("get_reviews_for_chocolate", { p_chocolate_id: id });

        if (error) {
            throw APIError.internal(`Failed to fetch reviews: ${error.message}`);
        }

        const reviews = (data || []).map((r: any) => ({
            id: r.id,
            chocolate_id: id,
            rating: r.rating,
            comment: r.comment,
            reviewer_name: r.reviewer_name,
            created_at: r.created_at
        }));

        const review_count = reviews.length;
        const avg_rating = review_count > 0 
            ? reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / review_count
            : 0;

        return {
            ...choco,
            avg_rating,
            review_count,
            reviews
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
    description_tr?: string;
    description_en?: string;
}

export interface ImportProductsRequest {
    products: ImportProduct[];
}

// Bulk import (legacy compatibility / dummy)
export const importProducts = api(
    { expose: true, method: "POST", path: "/chocolate/import" },
    async (): Promise<{ count: number }> => {
        return { count: 0 };
    }
);

// Add a review using Supabase RPC (stores review linked to slug chocolate_id)
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

// Seed (legacy compatibility / dummy)
export const seedChocolates = api(
    { expose: true, method: "POST", path: "/chocolate/seed" },
    async (): Promise<{ count: number }> => {
        return { count: 0 };
    }
);
