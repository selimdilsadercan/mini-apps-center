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

export interface SummaryStats {
  totalOrders: number;
  activeOrders: number;
  totalEarnings: number;
  pendingPayments: number;
}
