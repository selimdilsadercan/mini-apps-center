import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

// Create Supabase client
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== REQUEST/RESPONSE TYPES ====================

export interface SummaryStats {
  totalOrders: number;
  activeOrders: number;
  totalEarnings: number;
  pendingPayments: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  instagramUsername?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
  orderCount: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerInstagram?: string | null;
  customerPhone?: string | null;
  title: string;
  price: number;
  paidAmount: number;
  status: "received" | "in_progress" | "ready" | "delivered" | "cancelled";
  orderDate: string;
  deadline?: string | null;
  materialsNotes?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface GetSummaryRequest {
  userId: string;
}

interface GetSummaryResponse {
  stats: SummaryStats;
}

interface GetCustomersRequest {
  userId: string;
}

interface GetCustomersResponse {
  customers: Customer[];
}

interface UpsertCustomerRequest {
  id?: string | null;
  userId: string;
  name: string;
  phone?: string | null;
  instagramUsername?: string | null;
  address?: string | null;
  notes?: string | null;
}

interface UpsertCustomerResponse {
  customer: Customer;
}

interface GetOrdersRequest {
  userId: string;
  status?: string | null;
}

interface GetOrdersResponse {
  orders: Order[];
}

interface UpsertOrderRequest {
  id?: string | null;
  userId: string;
  customerId: string;
  title: string;
  price: number;
  paidAmount: number;
  status: "received" | "in_progress" | "ready" | "delivered" | "cancelled";
  orderDate: string;
  deadline?: string | null;
  materialsNotes?: string | null;
  notes?: string | null;
}

interface UpsertOrderResponse {
  order: Order;
}

interface DeleteOrderRequest {
  orderId: string;
  userId: string;
}

interface DeleteOrderResponse {
  success: boolean;
}

interface DeleteCustomerRequest {
  customerId: string;
  userId: string;
}

interface DeleteCustomerResponse {
  success: boolean;
}

// ==================== API ENDPOINTS ====================

/**
 * Sipariş durum özet istatistiklerini getirir.
 * GET /siparis-takip/summary/:userId
 */
export const getSummary = api(
  { expose: true, method: "GET", path: "/siparis-takip/summary/:userId" },
  async ({ userId }: GetSummaryRequest): Promise<GetSummaryResponse> => {
    const { data, error } = await supabase.schema("siparis_takip").rpc("get_summary", {
      p_user_id: userId,
    });

    if (error) {
      console.error("getSummary error:", error);
      throw APIError.internal("Özet istatistikler yüklenemedi");
    }

    const row = data?.[0] || { total_orders: 0, active_orders: 0, total_earnings: 0, pending_payments: 0 };
    return {
      stats: {
        totalOrders: Number(row.total_orders || 0),
        activeOrders: Number(row.active_orders || 0),
        totalEarnings: Number(row.total_earnings || 0),
        pendingPayments: Number(row.pending_payments || 0),
      },
    };
  }
);

/**
 * Kullanıcıya ait tüm müşterileri listeler.
 * GET /siparis-takip/customers/:userId
 */
export const getCustomers = api(
  { expose: true, method: "GET", path: "/siparis-takip/customers/:userId" },
  async ({ userId }: GetCustomersRequest): Promise<GetCustomersResponse> => {
    const { data, error } = await supabase.schema("siparis_takip").rpc("get_customers", {
      p_user_id: userId,
    });

    if (error) {
      console.error("getCustomers error:", error);
      throw APIError.internal("Müşteriler listelenemedi");
    }

    const customers: Customer[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      instagramUsername: row.instagram_username,
      address: row.address,
      notes: row.notes,
      createdAt: row.created_at,
      orderCount: Number(row.order_count || 0),
    }));

    return { customers };
  }
);

/**
 * Müşteri oluşturur veya günceller.
 * POST /siparis-takip/customer
 */
export const upsertCustomer = api(
  { expose: true, method: "POST", path: "/siparis-takip/customer" },
  async (req: UpsertCustomerRequest): Promise<UpsertCustomerResponse> => {
    const { data, error } = await supabase.schema("siparis_takip").rpc("upsert_customer", {
      p_id: req.id || null,
      p_user_id: req.userId,
      p_name: req.name,
      p_phone: req.phone || null,
      p_instagram_username: req.instagramUsername || null,
      p_address: req.address || null,
      p_notes: req.notes || null,
    });

    if (error) {
      console.error("upsertCustomer error:", error);
      throw APIError.internal("Müşteri kaydedilemedi");
    }

    const row = data?.[0] || data;
    if (!row) {
      throw APIError.internal("Kayıt işlemi başarısız");
    }

    return {
      customer: {
        id: row.id,
        name: row.name,
        phone: row.phone,
        instagramUsername: row.instagram_username,
        address: row.address,
        notes: row.notes,
        createdAt: row.created_at,
        orderCount: 0, // Freshly created/edited
      },
    };
  }
);

/**
 * Siparişleri listeler (isteğe bağlı durum filtresi ile).
 * GET /siparis-takip/orders/:userId
 */
export const getOrders = api(
  { expose: true, method: "GET", path: "/siparis-takip/orders/:userId" },
  async ({ userId, status }: GetOrdersRequest): Promise<GetOrdersResponse> => {
    const { data, error } = await supabase.schema("siparis_takip").rpc("get_orders", {
      p_user_id: userId,
      p_status: status || null,
    });

    if (error) {
      console.error("getOrders error:", error);
      throw APIError.internal("Siparişler listelenemedi");
    }

    const orders: Order[] = (data || []).map((row: any) => ({
      id: row.id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerInstagram: row.customer_instagram,
      customerPhone: row.customer_phone,
      title: row.title,
      price: Number(row.price || 0),
      paidAmount: Number(row.paid_amount || 0),
      status: row.status,
      orderDate: row.order_date,
      deadline: row.deadline,
      materialsNotes: row.materials_notes,
      notes: row.notes,
      createdAt: row.created_at,
    }));

    return { orders };
  }
);

/**
 * Sipariş oluşturur veya günceller.
 * POST /siparis-takip/order
 */
export const upsertOrder = api(
  { expose: true, method: "POST", path: "/siparis-takip/order" },
  async (req: UpsertOrderRequest): Promise<UpsertOrderResponse> => {
    const { data, error } = await supabase.schema("siparis_takip").rpc("upsert_order", {
      p_id: req.id || null,
      p_user_id: req.userId,
      p_customer_id: req.customerId,
      p_title: req.title,
      p_price: req.price,
      p_paid_amount: req.paidAmount,
      p_status: req.status,
      p_order_date: req.orderDate,
      p_deadline: req.deadline || null,
      p_materials_notes: req.materialsNotes || null,
      p_notes: req.notes || null,
    });

    if (error) {
      console.error("upsertOrder error:", error);
      throw APIError.internal("Sipariş kaydedilemedi");
    }

    const row = data?.[0] || data;
    if (!row) {
      throw APIError.internal("Sipariş kaydedilemedi");
    }

    // Get order with customer info mapped
    const { data: ordDetails, error: ordErr } = await supabase.schema("siparis_takip").rpc("get_orders", {
      p_user_id: req.userId,
    });

    const mappedOrder = (ordDetails || []).find((o: any) => o.id === row.id);
    if (!mappedOrder) {
      throw APIError.internal("Sipariş detayları alınamadı");
    }

    return {
      order: {
        id: mappedOrder.id,
        customerId: mappedOrder.customer_id,
        customerName: mappedOrder.customer_name,
        customerInstagram: mappedOrder.customer_instagram,
        customerPhone: mappedOrder.customer_phone,
        title: mappedOrder.title,
        price: Number(mappedOrder.price || 0),
        paidAmount: Number(mappedOrder.paid_amount || 0),
        status: mappedOrder.status,
        orderDate: mappedOrder.order_date,
        deadline: mappedOrder.deadline,
        materialsNotes: mappedOrder.materials_notes,
        notes: mappedOrder.notes,
        createdAt: mappedOrder.created_at,
      },
    };
  }
);

/**
 * Siparişi siler.
 * DELETE /siparis-takip/order/:orderId
 */
export const deleteOrder = api(
  { expose: true, method: "DELETE", path: "/siparis-takip/order/:orderId" },
  async ({ orderId, userId }: DeleteOrderRequest): Promise<DeleteOrderResponse> => {
    const { data, error } = await supabase.schema("siparis_takip").rpc("delete_order", {
      p_id: orderId,
      p_user_id: userId,
    });

    if (error) {
      console.error("deleteOrder error:", error);
      throw APIError.internal("Sipariş silinemedi");
    }

    return { success: Boolean(data) };
  }
);

/**
 * Müşteriyi siler.
 * DELETE /siparis-takip/customer/:customerId
 */
export const deleteCustomer = api(
  { expose: true, method: "DELETE", path: "/siparis-takip/customer/:customerId" },
  async ({ customerId, userId }: DeleteCustomerRequest): Promise<DeleteCustomerResponse> => {
    const { data, error } = await supabase.schema("siparis_takip").rpc("delete_customer", {
      p_id: customerId,
      p_user_id: userId,
    });

    if (error) {
      console.error("deleteCustomer error:", error);
      throw APIError.internal("Müşteri silinemedi. Siparişleri olduğu için silinemiyor olabilir.");
    }

    return { success: Boolean(data) };
  }
);
