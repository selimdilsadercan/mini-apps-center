import { createBrowserClient } from "@/lib/api";
import { getErrorMessage, isUnauthenticatedError } from "@/lib/api-error-handler";
import type { Customer, Order, SummaryStats } from "./types";

interface ActionResponse<T> {
  data: T | null;
  error: string | null;
}

export async function getSummaryAction(clerkId: string): Promise<ActionResponse<SummaryStats>> {
  try {
    const client = createBrowserClient() as any;
    const response = await client.siparis_takip.getSummary(clerkId);
    return { data: response.stats, error: null };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getCustomersAction(clerkId: string): Promise<ActionResponse<Customer[]>> {
  try {
    const client = createBrowserClient() as any;
    const response = await client.siparis_takip.getCustomers(clerkId);
    return { data: response.customers ?? [], error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function upsertCustomerAction(params: {
  id?: string | null;
  userId: string;
  name: string;
  phone?: string | null;
  instagramUsername?: string | null;
  address?: string | null;
  notes?: string | null;
}): Promise<ActionResponse<Customer>> {
  try {
    const client = createBrowserClient() as any;
    const response = await client.siparis_takip.upsertCustomer({
      id: params.id || null,
      userId: params.userId,
      name: params.name,
      phone: params.phone || null,
      instagramUsername: params.instagramUsername || null,
      address: params.address || null,
      notes: params.notes || null,
    });
    return { data: response.customer, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getOrdersAction(clerkId: string, status?: string): Promise<ActionResponse<Order[]>> {
  try {
    const client = createBrowserClient() as any;
    const response = await client.siparis_takip.getOrders(clerkId, { status: status || undefined });
    return { data: response.orders ?? [], error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function upsertOrderAction(params: {
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
}): Promise<ActionResponse<Order>> {
  try {
    const client = createBrowserClient() as any;
    const response = await client.siparis_takip.upsertOrder({
      id: params.id || null,
      userId: params.userId,
      customerId: params.customerId,
      title: params.title,
      price: params.price,
      paidAmount: params.paidAmount,
      status: params.status,
      orderDate: params.orderDate,
      deadline: params.deadline || null,
      materialsNotes: params.materialsNotes || null,
      notes: params.notes || null,
    });
    return { data: response.order, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteOrderAction(orderId: string, clerkId: string): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient() as any;
    const response = await client.siparis_takip.deleteOrder(orderId, clerkId);
    return { data: response.success, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteCustomerAction(customerId: string, clerkId: string): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient() as any;
    const response = await client.siparis_takip.deleteCustomer(customerId, clerkId);
    return { data: response.success, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
