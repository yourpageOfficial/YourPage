export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  role: "supporter" | "creator" | "admin";
  locale?: string;
  is_banned?: boolean;
  ban_reason?: string;
  deletion_scheduled_at?: string;
  creator_profile?: CreatorProfile;
}

export interface CreatorProfile {
  page_slug: string;
  is_monetized: boolean;
  is_verified: boolean;
  follower_count: number;
  tier_id?: string;
  tier_expires_at?: string;
}

export interface Post {
  id: string;
  creator_id: string;
  creator?: User;
  title: string;
  content: string;
  excerpt?: string;
  access_type: "free" | "paid";
  visibility?: "public" | "paid" | "members";
  membership_tier_id?: string;
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
  supporter?: User;
  creator?: User;
  payment_id?: string;
  amount_idr: number;
  net_amount_idr: number;
  fee_idr?: number;
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

export interface ChatConversation {
  id: string;
  creator_id: string;
  supporter_id: string;
  creator?: User;
  supporter?: User;
  last_message_at?: string;
  creator_unread: number;
  supporter_unread: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: User;
  content: string;
  is_paid: boolean;
  created_at: string;
}

export interface MembershipTier {
  id: string;
  creator_id: string;
  name: string;
  price_credits: number;
  description?: string;
  perks?: string;
}

export interface Membership {
  id: string;
  tier_id: string;
  tier?: MembershipTier;
  creator_id: string;
  supporter_id: string;
  expires_at: string;
  created_at: string;
}

export interface OverlayTier {
  id: string;
  creator_id: string;
  min_credits: number;
  image_url?: string;
  label?: string;
}

export interface UserKYC {
  id: string;
  user_id: string;
  full_name: string;
  id_number?: string;
  ktp_image_url?: string;
  status: "pending" | "approved" | "rejected";
  admin_note?: string;
  created_at: string;
}

export interface ContentReport {
  id: string;
  reporter_id: string;
  reporter?: User;
  target_type: "post" | "product" | "user";
  target_id: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  admin_note?: string;
  created_at: string;
}

export interface ReferralCode {
  code: string;
  used_count: number;
}

export interface AdminAnalytics {
  total_users: number;
  total_creators: number;
  total_posts: number;
  total_products: number;
  gmv: number;
  revenue: number;
  total_donations_amount: number;
  withdrawals_processed_amount: number;
  reports_pending: number;
}

export interface CreatorEarnings {
  total_earnings: number;
  follower_count: number;
  post_count: number;
  tier_name?: string;
  tier_expires_at?: string;
  fee_percent: number;
  storage_used_bytes: number;
  storage_quota_bytes: number;
  page_color?: string;
  header_image?: string;
  social_links?: Record<string, string>;
  welcome_message?: string;
  donation_goal_title?: string;
  donation_goal_amount?: number;
  donation_goal_current?: number;
  chat_price_idr?: number;
  chat_allow_from?: string;
  auto_reply?: string;
  overlay_style?: string;
  overlay_text_template?: string;
}

export interface Sale {
  id: string;
  usecase: "post_purchase" | "product_purchase" | "donation";
  amount_idr: number;
  net_amount_idr: number;
  fee_idr: number;
  payer?: User;
  status: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  usecase: string;
  amount_idr: number;
  net_amount_idr: number;
  fee_idr: number;
  provider: string;
  status: string;
  reference_id?: string;
  unique_code?: number;
  created_at: string;
}

export interface CreditTopup {
  id: string;
  user_id: string;
  user?: User;
  amount_idr: number;
  credits: number;
  unique_code?: number;
  donor_name?: string;
  proof_image_url?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface CreatorPage {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  page_slug: string;
  header_image?: string;
  social_links?: Record<string, string>;
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
