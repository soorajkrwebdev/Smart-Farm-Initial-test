// ===================================================
// Farmlynq CORE TYPES & DATA INTERFACES
// ===================================================

export type UserRole = 'farmer' | 'consumer' | 'worker' | 'admin';

export type VerificationStatus = 
  | 'unverified' 
  | 'phone_verified' 
  | 'profile_verified' 
  | 'admin_verified' 
  | 'fpo_verified';

export type ProductStatus = 'draft' | 'active' | 'paused' | 'sold_out' | 'expired';

export type OrderStatus = 
  | 'pending' 
  | 'accepted' 
  | 'preparing' 
  | 'ready_for_pickup' 
  | 'out_for_delivery' 
  | 'completed' 
  | 'cancelled' 
  | 'rejected';

export type PaymentMethod = 'cash_on_delivery' | 'pay_on_pickup' | 'upi_pending';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export type WorkerAvailability = 'available' | 'busy' | 'unavailable';
export type ApplicationStatus = 'applied' | 'accepted' | 'rejected' | 'withdrawn';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar_url?: string;
  state: string;
  district: string;
  village_town: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface FarmerProfile extends UserProfile {
  farm_name: string;
  farm_size_acres: number;
  primary_crops: string[];
  organic_certified: boolean;
  fpo_member: boolean;
  fpo_name?: string;
  bio?: string;
  rating: number;
  reviews_count: number;
}

export interface ConsumerProfile extends UserProfile {
  delivery_preference: 'pickup' | 'farmer_delivery' | 'both';
  default_delivery_address?: string;
}

export interface WorkerProfile extends UserProfile {
  skills: string[];
  experience_years: number;
  daily_wage_rate: number;
  availability_status: WorkerAvailability;
  languages: string[];
  rating: number;
  reviews_count: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  farmer_id: string;
  farmer_name?: string;
  farmer_rating?: number;
  farmer_verification?: VerificationStatus;
  category_id: string;
  category_name?: string;
  name: string;
  variety?: string;
  description: string;
  price: number;
  unit: 'kg' | 'gram' | 'quintal' | 'ton' | 'litre' | 'piece' | 'dozen' | 'bundle' | 'bag';
  quantity_available: number;
  reserved_quantity: number;
  min_order_quantity: number;
  harvest_date?: string;
  quality_grade: string;
  is_organic: boolean;
  images: string[];
  status: ProductStatus;
  village_town: string;
  district: string;
  state: string;
  mandi_reference_price?: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  unit: string;
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  consumer_id: string;
  consumer_name?: string;
  consumer_phone?: string;
  farmer_id: string;
  farmer_name?: string;
  farmer_phone?: string;
  total_amount: number;
  status: OrderStatus;
  delivery_type: 'pickup' | 'farmer_delivery';
  delivery_address?: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface WorkerJob {
  id: string;
  farmer_id: string;
  farmer_name?: string;
  farmer_phone?: string;
  title: string;
  work_type: string;
  description: string;
  village_town: string;
  district: string;
  state: string;
  start_date: string;
  start_time: string;
  duration_days: number;
  workers_needed: number;
  workers_hired: number;
  daily_wage: number;
  skills_required: string[];
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  applicant_count?: number;
  created_at: string;
}

export interface WorkerApplication {
  id: string;
  job_id: string;
  job?: WorkerJob;
  worker_id: string;
  worker?: WorkerProfile;
  status: ApplicationStatus;
  proposed_wage?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketPrice {
  id: string;
  commodity: string;
  variety?: string;
  market: string;
  district: string;
  state: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  unit: string;
  price_date: string;
  source: string;
  source_url?: string;
  fetched_at: string;
}

export interface WeatherForecastDay {
  date: string;
  day_name: string;
  max_temp: number;
  min_temp: number;
  condition: string;
  rain_probability: number;
  rainfall_mm: number;
}

export interface WeatherData {
  district: string;
  state: string;
  current_temp: number;
  condition: string;
  feels_like?: number;
  humidity: number;
  wind_speed: number;
  rain_probability: number;
  rainfall_mm: number;
  uv_index?: number;
  forecast: WeatherForecastDay[];
  alerts: string[];
  agricultural_advisory: string;
  updated_at: string;
  source: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  cover_image: string;
  author: string;
  official_source?: string;
  official_url?: string;
  is_published: boolean;
  tags: string[];
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'order' | 'market_price' | 'weather' | 'worker' | 'job' | 'system' | 'ai';
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  order_id?: string;
  reviewer_id: string;
  reviewer_name: string;
  target_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: {
    tool_name: string;
    params?: Record<string, unknown>;
    result?: Record<string, unknown> | string;
  }[];
  timestamp: string;
}
