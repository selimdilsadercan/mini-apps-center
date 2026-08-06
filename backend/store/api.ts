import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

// Create Supabase client
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPE DEFINITIONS ====================

export interface Store {
  id: string;
  created_user_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  contact_whatsapp: string | null;
  contact_instagram: string | null;
  contact_email: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_urls: string[];
  category: string;
  is_available: boolean;
  created_at: string;
}

export interface ProductWithStore {
  id: string;
  store_id: string;
  store_name: string;
  store_logo_url: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_urls: string[];
  category: string;
  is_available: boolean;
  created_at: string;
}

// ==================== REQUEST / RESPONSE INTERFACES ====================

interface GetStoreByUserRequest {
  userId: string;
}

interface GetStoreResponse {
  store: Store | null;
}

interface GetStoreByIdRequest {
  storeId: string;
}

interface CreateStoreRequest {
  userId: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  contactWhatsapp?: string | null;
  contactInstagram?: string | null;
  contactEmail?: string | null;
}

interface UpdateStoreRequest {
  storeId: string;
  userId: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  contactWhatsapp?: string | null;
  contactInstagram?: string | null;
  contactEmail?: string | null;
}

interface GetStoreProductsRequest {
  storeId: string;
}

interface GetStoreProductsResponse {
  products: Product[];
}

interface GetAllProductsRequest {
  category?: string | null;
}

interface GetAllProductsResponse {
  products: ProductWithStore[];
}

interface GetProductByIdRequest {
  productId: string;
}

interface GetProductByIdResponse {
  product: Product | null;
}

interface CreateProductRequest {
  userId: string;
  storeId: string;
  name: string;
  description?: string | null;
  price: number;
  currency?: string | null;
  imageUrls?: string[] | null;
  category: string;
}

interface CreateProductResponse {
  product: Product | null;
}

interface UpdateProductRequest {
  productId: string;
  userId: string;
  name: string;
  description?: string | null;
  price: number;
  currency?: string | null;
  imageUrls?: string[] | null;
  category: string;
  isAvailable: boolean;
}

interface UpdateProductResponse {
  product: Product | null;
}

interface DeleteProductRequest {
  productId: string;
  userId: string;
}

interface DeleteProductResponse {
  success: boolean;
}

// ==================== API ENDPOINTS ====================

/**
  * Belirli bir kullanıcının sahip olduğu mağazayı getirir.
  * GET /store/user/:userId
  */
export const getStoreByUserId = api(
  { expose: true, method: "GET", path: "/store/user/:userId" },
  async ({ userId }: GetStoreByUserRequest): Promise<GetStoreResponse> => {
    const { data, error } = await supabase.schema("store").rpc("get_store_by_user_id", {
      p_user_id: userId,
    });

    if (error) {
      console.error("getStoreByUserId error:", error);
      throw APIError.internal("Mağaza bilgisi alınamadı");
    }

    const row = (data as any[])?.[0];
    return {
      store: row ? {
        id: row.id,
        created_user_id: row.created_user_id,
        name: row.name,
        description: row.description,
        logo_url: row.logo_url,
        banner_url: row.banner_url,
        contact_whatsapp: row.contact_whatsapp,
        contact_instagram: row.contact_instagram,
        contact_email: row.contact_email,
        created_at: row.created_at,
      } : null,
    };
  }
);

/**
  * Mağaza ID'sine göre detay getirir.
  * GET /store/:storeId
  */
export const getStoreById = api(
  { expose: true, method: "GET", path: "/store/:storeId" },
  async ({ storeId }: GetStoreByIdRequest): Promise<GetStoreResponse> => {
    const { data, error } = await supabase.schema("store").rpc("get_store_by_id", {
      p_store_id: storeId,
    });

    if (error) {
      console.error("getStoreById error:", error);
      throw APIError.internal("Mağaza detayı alınamadı");
    }

    const row = (data as any[])?.[0];
    return {
      store: row ? {
        id: row.id,
        created_user_id: row.created_user_id,
        name: row.name,
        description: row.description,
        logo_url: row.logo_url,
        banner_url: row.banner_url,
        contact_whatsapp: row.contact_whatsapp,
        contact_instagram: row.contact_instagram,
        contact_email: row.contact_email,
        created_at: row.created_at,
      } : null,
    };
  }
);

/**
  * Yeni mağaza oluşturur.
  * POST /store
  */
export const createStore = api(
  { expose: true, method: "POST", path: "/store" },
  async (req: CreateStoreRequest): Promise<GetStoreResponse> => {
    const { data, error } = await supabase.schema("store").rpc("create_store", {
      p_user_id: req.userId,
      p_name: req.name,
      p_description: req.description || null,
      p_logo_url: req.logoUrl || null,
      p_banner_url: req.bannerUrl || null,
      p_contact_whatsapp: req.contactWhatsapp || null,
      p_contact_instagram: req.contactInstagram || null,
      p_contact_email: req.contactEmail || null,
    });

    if (error) {
      console.error("createStore error:", error);
      throw APIError.internal("Mağaza oluşturulamadı");
    }

    const row = data as any;
    return {
      store: row ? {
        id: row.id,
        created_user_id: row.created_user_id,
        name: row.name,
        description: row.description,
        logo_url: row.logo_url,
        banner_url: row.banner_url,
        contact_whatsapp: row.contact_whatsapp,
        contact_instagram: row.contact_instagram,
        contact_email: row.contact_email,
        created_at: row.created_at,
      } : null,
    };
  }
);

/**
  * Var olan mağazayı günceller.
  * PUT /store/:storeId
  */
export const updateStore = api(
  { expose: true, method: "PUT", path: "/store/:storeId" },
  async (req: UpdateStoreRequest): Promise<GetStoreResponse> => {
    const { data, error } = await supabase.schema("store").rpc("update_store", {
      p_user_id: req.userId,
      p_store_id: req.storeId,
      p_name: req.name,
      p_description: req.description || null,
      p_logo_url: req.logoUrl || null,
      p_banner_url: req.bannerUrl || null,
      p_contact_whatsapp: req.contactWhatsapp || null,
      p_contact_instagram: req.contactInstagram || null,
      p_contact_email: req.contactEmail || null,
    });

    if (error) {
      console.error("updateStore error:", error);
      throw APIError.internal("Mağaza güncellenemedi");
    }

    const row = data as any;
    return {
      store: row ? {
        id: row.id,
        created_user_id: row.created_user_id,
        name: row.name,
        description: row.description,
        logo_url: row.logo_url,
        banner_url: row.banner_url,
        contact_whatsapp: row.contact_whatsapp,
        contact_instagram: row.contact_instagram,
        contact_email: row.contact_email,
        created_at: row.created_at,
      } : null,
    };
  }
);

/**
  * Belirli bir mağazaya ait ürünleri listeler.
  * GET /store/:storeId/products
  */
export const getStoreProducts = api(
  { expose: true, method: "GET", path: "/store/:storeId/products" },
  async ({ storeId }: GetStoreProductsRequest): Promise<GetStoreProductsResponse> => {
    const { data, error } = await supabase.schema("store").rpc("get_store_products", {
      p_store_id: storeId,
    });

    if (error) {
      console.error("getStoreProducts error:", error);
      throw APIError.internal("Mağaza ürünleri alınamadı");
    }

    const rows = (data || []) as any[];
    return {
      products: rows.map((row) => ({
        id: row.id,
        store_id: row.store_id,
        name: row.name,
        description: row.description,
        price: Number(row.price),
        currency: row.currency,
        image_urls: Array.isArray(row.image_urls) ? row.image_urls : [],
        category: row.category,
        is_available: row.is_available,
        created_at: row.created_at,
      })),
    };
  }
);

/**
  * Tüm mağazaların ürünlerini toplu listeler (Keşfet akışı).
  * GET /store/products
  */
export const getAllProducts = api(
  { expose: true, method: "GET", path: "/store/products" },
  async ({ category }: GetAllProductsRequest): Promise<GetAllProductsResponse> => {
    const { data, error } = await supabase.schema("store").rpc("get_all_products", {
      p_category: category || null,
    });

    if (error) {
      console.error("getAllProducts error:", error);
      throw APIError.internal("Ürünler listelenemedi");
    }

    const rows = (data || []) as any[];
    return {
      products: rows.map((row) => ({
        id: row.id,
        store_id: row.store_id,
        store_name: row.store_name,
        store_logo_url: row.store_logo_url,
        name: row.name,
        description: row.description,
        price: Number(row.price),
        currency: row.currency,
        image_urls: Array.isArray(row.image_urls) ? row.image_urls : [],
        category: row.category,
        is_available: row.is_available,
        created_at: row.created_at,
      })),
    };
  }
);

/**
  * Tek bir ürünün detaylarını getirir.
  * GET /store/product/:productId
  */
export const getProductById = api(
  { expose: true, method: "GET", path: "/store/product/:productId" },
  async ({ productId }: GetProductByIdRequest): Promise<GetProductByIdResponse> => {
    const { data, error } = await supabase
      .schema("store")
      .from("products")
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    if (error) {
      console.error("getProductById error:", error);
      throw APIError.internal("Ürün detayı alınamadı");
    }

    return {
      product: data ? {
        id: data.id,
        store_id: data.store_id,
        name: data.name,
        description: data.description,
        price: Number(data.price),
        currency: data.currency,
        image_urls: Array.isArray(data.image_urls) ? data.image_urls : [],
        category: data.category,
        is_available: data.is_available,
        created_at: data.created_at,
      } : null,
    };
  }
);

/**
  * Yeni ürün ekler.
  * POST /store/product
  */
export const createProduct = api(
  { expose: true, method: "POST", path: "/store/product" },
  async (req: CreateProductRequest): Promise<CreateProductResponse> => {
    const { data, error } = await supabase.schema("store").rpc("create_product", {
      p_user_id: req.userId,
      p_store_id: req.storeId,
      p_name: req.name,
      p_description: req.description || null,
      p_price: req.price,
      p_currency: req.currency || "TRY",
      p_image_urls: req.imageUrls || [],
      p_category: req.category,
    });

    if (error) {
      console.error("createProduct error:", error);
      throw APIError.internal("Ürün oluşturulamadı: " + error.message);
    }

    const row = data as any;
    return {
      product: row ? {
        id: row.id,
        store_id: row.store_id,
        name: row.name,
        description: row.description,
        price: Number(row.price),
        currency: row.currency,
        image_urls: Array.isArray(row.image_urls) ? row.image_urls : [],
        category: row.category,
        is_available: row.is_available,
        created_at: row.created_at,
      } : null,
    };
  }
);

/**
  * Ürünü günceller.
  * PUT /store/product/:productId
  */
export const updateProduct = api(
  { expose: true, method: "PUT", path: "/store/product/:productId" },
  async (req: UpdateProductRequest): Promise<UpdateProductResponse> => {
    const { data, error } = await supabase.schema("store").rpc("update_product", {
      p_user_id: req.userId,
      p_product_id: req.productId,
      p_name: req.name,
      p_description: req.description || null,
      p_price: req.price,
      p_currency: req.currency || "TRY",
      p_image_urls: req.imageUrls || [],
      p_category: req.category,
      p_is_available: req.isAvailable,
    });

    if (error) {
      console.error("updateProduct error:", error);
      throw APIError.internal("Ürün güncellenemedi: " + error.message);
    }

    const row = data as any;
    return {
      product: row ? {
        id: row.id,
        store_id: row.store_id,
        name: row.name,
        description: row.description,
        price: Number(row.price),
        currency: row.currency,
        image_urls: Array.isArray(row.image_urls) ? row.image_urls : [],
        category: row.category,
        is_available: row.is_available,
        created_at: row.created_at,
      } : null,
    };
  }
);

/**
  * Ürün siler.
  * DELETE /store/product/:productId
  */
export const deleteProduct = api(
  { expose: true, method: "DELETE", path: "/store/product/:productId" },
  async ({ productId, userId }: DeleteProductRequest): Promise<DeleteProductResponse> => {
    const { data, error } = await supabase.schema("store").rpc("delete_product", {
      p_user_id: userId,
      p_product_id: productId,
    });

    if (error) {
      console.error("deleteProduct error:", error);
      throw APIError.internal("Ürün silinemedi: " + error.message);
    }

    if (!data) {
      throw APIError.permissionDenied("Bu ürünü silme yetkiniz yok");
    }

    return { success: true };
  }
);
