export type CategoryId = "study" | "audio" | "commute" | "desk";

export type VisualKey =
  | "headphones"
  | "lamp"
  | "bag"
  | "keyboard"
  | "bottle"
  | "notebook"
  | "speaker"
  | "organizer";

export interface Category {
  id: CategoryId;
  name: string;
  english: string;
  description: string;
  visual: VisualKey;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  price: number;
  originalPrice?: number;
  summary: string;
  description: string;
  features: string[];
  specs: ProductSpec[];
  rating: number;
  reviewCount: number;
  inventory: number;
  art: VisualKey;
  color: string;
  badge?: string;
  featured: boolean;
  createdAt: string;
}

export interface NewsArticle {
  id: string;
  slug: string;
  category: "品牌动态" | "生活灵感" | "校园观察";
  title: string;
  excerpt: string;
  body: string[];
  publishedAt: string;
  readTime: number;
  art: VisualKey;
  color: string;
}

export interface Story {
  id: string;
  kicker: string;
  title: string;
  excerpt: string;
  quote: string;
  author: string;
  school: string;
  art: VisualKey;
  color: string;
}

export interface HeroSlide {
  eyebrow: string;
  title: string;
  emphasis: string;
  description: string;
  cta: string;
  href: string;
  art: VisualKey;
  theme: "forest" | "clay" | "cream";
  note: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CheckoutInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  note?: string;
}

export interface OrderLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  art: VisualKey;
}

export interface Order {
  id: string;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: "已确认" | "备货中" | "已发货";
  customer: CheckoutInfo;
  createdAt: string;
}

export interface Catalog {
  products: Product[];
  articles: NewsArticle[];
}

export interface ToastMessage {
  id: number;
  title: string;
  detail?: string;
}
