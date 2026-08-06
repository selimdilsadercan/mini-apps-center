"use server";

import { createServerClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/api-error-handler";
import type { Store, Product, ProductWithStore } from "./types";

interface ActionResponse<T> {
  data: T | null;
  error: string | null;
}

export async function getStoreByUserAction(userId: string): Promise<ActionResponse<Store>> {
  try {
    const client = await createServerClient();
    const response = await client.store.getStoreByUserId(userId);
    return { data: response.store as Store | null, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getStoreByIdAction(storeId: string): Promise<ActionResponse<Store>> {
  try {
    const client = await createServerClient();
    const response = await client.store.getStoreById(storeId);
    return { data: response.store as Store | null, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createStoreAction(params: {
  userId: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  contactWhatsapp?: string | null;
  contactInstagram?: string | null;
  contactEmail?: string | null;
}): Promise<ActionResponse<Store>> {
  try {
    const client = await createServerClient();
    const response = await client.store.createStore(params);
    return { data: response.store as Store | null, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updateStoreAction(params: {
  storeId: string;
  userId: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  contactWhatsapp?: string | null;
  contactInstagram?: string | null;
  contactEmail?: string | null;
}): Promise<ActionResponse<Store>> {
  try {
    const client = await createServerClient();
    const response = await client.store.updateStore(params.storeId, params);
    return { data: response.store as Store | null, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getStoreProductsAction(storeId: string): Promise<ActionResponse<Product[]>> {
  try {
    const client = await createServerClient();
    const response = await client.store.getStoreProducts(storeId);
    return { data: (response.products ?? []) as Product[], error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getAllProductsAction(category?: string | null): Promise<ActionResponse<ProductWithStore[]>> {
  try {
    const client = await createServerClient();
    const response = await client.store.getAllProducts({ category });
    return { data: (response.products ?? []) as ProductWithStore[], error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getProductByIdAction(productId: string): Promise<ActionResponse<Product>> {
  try {
    const client = await createServerClient();
    const response = await client.store.getProductById(productId);
    return { data: response.product as Product | null, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createProductAction(params: {
  userId: string;
  storeId: string;
  name: string;
  description?: string | null;
  price: number;
  currency?: string | null;
  imageUrls?: string[] | null;
  category: string;
}): Promise<ActionResponse<Product>> {
  try {
    const client = await createServerClient();
    const response = await client.store.createProduct(params);
    return { data: response.product as Product | null, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updateProductAction(params: {
  productId: string;
  userId: string;
  name: string;
  description?: string | null;
  price: number;
  currency?: string | null;
  imageUrls?: string[] | null;
  category: string;
  isAvailable: boolean;
}): Promise<ActionResponse<Product>> {
  try {
    const client = await createServerClient();
    const response = await client.store.updateProduct(params.productId, params);
    return { data: response.product as Product | null, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteProductAction(productId: string, userId: string): Promise<ActionResponse<boolean>> {
  try {
    const client = await createServerClient();
    const response = await client.store.deleteProduct(productId, { userId });
    return { data: response.success, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
