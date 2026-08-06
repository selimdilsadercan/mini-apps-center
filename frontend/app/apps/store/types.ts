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
