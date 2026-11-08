import type { CameraCategory } from "../../types";

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  stock: number;
  sku: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  brand: string;
  category: CameraCategory;
  pricePerDay: number;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  image: string;
  imageAlt: string;
  description: string;
  available: boolean;
  variants: ProductVariant[];
}

export type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Completed" | "Refunded" | "Cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  pricePerDay: number;
  days: number;
}

export interface OrderCustomer {
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  title: string;
  gender: string;
  pronouns: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customer: OrderCustomer;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: string;
  trackingNumber: string | null;
  shippingLabel: string | null;
  notes: string;
}

export const categoryOptions: { label: string; value: CameraCategory }[] = [
  { label: "Mirrorless", value: "Mirrorless" },
  { label: "DSLR", value: "DSLR" },
  { label: "Cinema", value: "Cinema" },
  { label: "Drone", value: "Drone" },
  { label: "Action", value: "Action" },
  { label: "Film", value: "Film" },
];

export const titleOptions = ["Mr.", "Ms.", "Mx.", "Dr.", "Prof.", "No Title"];
export const genderOptions = ["Female", "Male", "Non-Binary", "Prefer Not to Say", "Self-Describe"];
export const pronounOptions = ["she/her", "he/him", "they/them", "she/they", "he/they", "Other"];

export const orderStatusOptions: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered", "Completed", "Refunded", "Cancelled"];

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const formatMoney = (value: number) => moneyFormatter.format(value);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function statusToVariant(status: OrderStatus): "success" | "warning" | "danger" | "info" | "violet" | "neutral" {
  switch (status) {
    case "Delivered": return "success";
    case "Completed": return "success";
    case "Processing": return "info";
    case "Shipped": return "violet";
    case "Pending": return "warning";
    case "Refunded": return "neutral";
    case "Cancelled": return "danger";
    default: return "neutral";
  }
}
