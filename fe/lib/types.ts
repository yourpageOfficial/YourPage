export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  role: "supporter" | "creator" | "admin";
  creator_profile?: {
    page_slug: string;
    is_monetized: boolean;
    is_verified: boolean;
    follower_count: number;
  };
}

export interface Post {
  id: string;
  creator_id: string;
  creator?: User;
  title: string;
  content: string;
  excerpt?: string;
  access_type: "free" | "paid";
  price?: number;
  status: "draft" | "published";
  published_at?: string;
  scheduled_at?: string;
  media: PostMedia[];
  view_count: number;
  like_count: number;
  comment_count: number;
  is_locked: boolean;
  has_purchased: boolean;
  has_liked: boolean;
  created_at: string;
}

export interface PostMedia {
  id: string;
  url: string;
  thumb_url?: string;
  media_type: "image" | "video" | "audio" | "document";
  sort_order: number;
}

export interface Product {
  id: string;
  creator_id: string;
  creator?: User;
  name: string;
  slug: string;
  description?: string;
  type: "ebook" | "preset" | "template" | "other";
  price_idr: number;
  is_active: boolean;
  delivery_type: "file" | "link";
  delivery_url?: string;
  delivery_note?: string;
  thumbnail_url?: string;
  assets: ProductAsset[];
  sales_count: number;
  created_at: string;
}

export interface ProductAsset {
  id: string;
  file_name: string;
  file_size_kb: number;
  mime_type: string;
}

export interface Donation {
  id: string;
  creator_id: string;
  amount_idr: number;
  net_amount_idr: number;
  message?: string;
  donor_name: string;
  is_anonymous: boolean;
  status: string;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  amount_idr: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: "pending" | "approved" | "rejected" | "processed";
  admin_note?: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance_credits: number;
}

export interface CreditTransaction {
  id: string;
  type: "topup" | "spend" | "refund" | "withdrawal" | "earning";
  credits: number;
  idr_amount: number;
  description: string;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  next_cursor?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface CreatorPage {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  page_slug: string;
  header_image?: string;
  social_links: Record<string, string>;
  follower_count: number;
  is_verified: boolean;
  tier_badge?: string;
  page_color?: string;
  is_priority?: boolean;
  chat_price_idr?: number;
  donation_goal_title?: string;
  donation_goal_amount: number;
  donation_goal_current: number;
}

export interface PlatformSettings {
  id: string;
  fee_percent: number;
  min_withdrawal_idr: number;
  credit_rate_idr: number;
  platform_qris_url?: string;
}

export interface Payment {
  id: string;
  status: "pending" | "paid" | "failed" | "expired";
  amount_idr: number;
  created_at: string;
}
