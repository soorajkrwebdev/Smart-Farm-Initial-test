-- ===================================================
-- FarmNexa POSTGRESQL SCHEMA & ROW LEVEL SECURITY
-- ===================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Types & Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('farmer', 'consumer', 'worker', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status_type AS ENUM ('unverified', 'phone_verified', 'profile_verified', 'admin_verified', 'fpo_verified');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE product_status_type AS ENUM ('draft', 'active', 'paused', 'sold_out', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status_type AS ENUM ('pending', 'accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE worker_avail_type AS ENUM ('available', 'busy', 'unavailable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE app_status_type AS ENUM ('applied', 'accepted', 'rejected', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'consumer',
  avatar_url TEXT,
  state TEXT DEFAULT 'Karnataka',
  district TEXT DEFAULT 'Dakshina Kannada',
  village_town TEXT,
  pincode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  verification_status verification_status_type NOT NULL DEFAULT 'unverified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Farmers Table
CREATE TABLE IF NOT EXISTS public.farmers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  farm_name TEXT,
  farm_size_acres NUMERIC(6,2),
  primary_crops TEXT[] DEFAULT '{}',
  organic_certified BOOLEAN NOT NULL DEFAULT false,
  fpo_member BOOLEAN NOT NULL DEFAULT false,
  fpo_name TEXT,
  bio TEXT,
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  reviews_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Consumers Table
CREATE TABLE IF NOT EXISTS public.consumers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  delivery_preference TEXT DEFAULT 'both',
  default_delivery_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Workers Table
CREATE TABLE IF NOT EXISTS public.workers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  skills TEXT[] DEFAULT '{}',
  experience_years NUMERIC(4,1) DEFAULT 0,
  daily_wage_rate NUMERIC(10,2),
  availability_status worker_avail_type NOT NULL DEFAULT 'available',
  languages TEXT[] DEFAULT '{"Kannada"}',
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  reviews_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Product Categories
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  variety TEXT,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  unit TEXT NOT NULL DEFAULT 'kg',
  quantity_available NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  reserved_quantity NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  min_order_quantity NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (min_order_quantity >= 0),
  harvest_date DATE,
  quality_grade TEXT DEFAULT 'Standard',
  is_organic BOOLEAN NOT NULL DEFAULT false,
  images TEXT[] DEFAULT '{}',
  status product_status_type NOT NULL DEFAULT 'active',
  village_town TEXT,
  district TEXT DEFAULT 'Dakshina Kannada',
  state TEXT DEFAULT 'Karnataka',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  consumer_id UUID NOT NULL REFERENCES public.consumers(id) ON DELETE RESTRICT,
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE RESTRICT,
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  status order_status_type NOT NULL DEFAULT 'pending',
  delivery_type TEXT NOT NULL DEFAULT 'pickup',
  delivery_address TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Order Items Table (Snapshot Pricing)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  unit_price_snapshot NUMERIC(10,2) NOT NULL,
  quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'kg',
  total_price NUMERIC(12,2) NOT NULL
);

-- 9. Worker Jobs
CREATE TABLE IF NOT EXISTS public.worker_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  farmer_name TEXT,
  farmer_phone TEXT,
  title TEXT NOT NULL,
  work_type TEXT NOT NULL,
  description TEXT,
  village_town TEXT,
  district TEXT DEFAULT 'Dakshina Kannada',
  state TEXT DEFAULT 'Karnataka',
  start_date DATE NOT NULL,
  start_time TEXT DEFAULT '08:00 AM',
  duration_days INT NOT NULL DEFAULT 1,
  workers_needed INT NOT NULL DEFAULT 1 CHECK (workers_needed >= 1),
  workers_hired INT NOT NULL DEFAULT 0,
  daily_wage NUMERIC(10,2) NOT NULL,
  skills_required TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open',
  applicant_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Worker Applications
CREATE TABLE IF NOT EXISTS public.worker_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.worker_jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  status app_status_type NOT NULL DEFAULT 'applied',
  proposed_wage NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, worker_id)
);

-- 11. Market Prices (Mandi Reference)
CREATE TABLE IF NOT EXISTS public.market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity TEXT NOT NULL,
  variety TEXT,
  market TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Karnataka',
  min_price NUMERIC(10,2) NOT NULL,
  max_price NUMERIC(10,2) NOT NULL,
  modal_price NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'Quintal',
  price_date DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'Agmarknet / Open Government Data India',
  source_url TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Weather Cache
CREATE TABLE IF NOT EXISTS public.weather_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Karnataka',
  current_temp NUMERIC(5,2) NOT NULL,
  condition TEXT NOT NULL,
  humidity NUMERIC(5,2) NOT NULL,
  wind_speed NUMERIC(5,2) NOT NULL,
  rain_probability NUMERIC(5,2) NOT NULL,
  forecast_json JSONB,
  alerts_json JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(district, state)
);

-- 13. Articles & Knowledge Hub
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image TEXT,
  author TEXT NOT NULL,
  official_source TEXT,
  official_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT,
  target_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Farmer Profiles Policies
CREATE POLICY "Farmers viewable by everyone" ON public.farmers
  FOR SELECT USING (true);
CREATE POLICY "Farmers can manage own record" ON public.farmers
  FOR ALL USING (auth.uid() = id);

-- Consumer Profiles Policies
CREATE POLICY "Consumers can view own record" ON public.consumers
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Consumers can manage own record" ON public.consumers
  FOR ALL USING (auth.uid() = id);

-- Workers Profiles Policies
CREATE POLICY "Workers viewable by public" ON public.workers
  FOR SELECT USING (true);
CREATE POLICY "Workers can manage own profile" ON public.workers
  FOR ALL USING (auth.uid() = id);

-- Products Policies
CREATE POLICY "Active products viewable by everyone" ON public.products
  FOR SELECT USING (status = 'active' OR auth.uid() = farmer_id);
CREATE POLICY "Farmers can insert products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "Farmers can update own products" ON public.products
  FOR UPDATE USING (auth.uid() = farmer_id);
CREATE POLICY "Farmers can delete own products" ON public.products
  FOR DELETE USING (auth.uid() = farmer_id);

-- Orders Policies
CREATE POLICY "Consumers and Farmers can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = consumer_id OR auth.uid() = farmer_id);
CREATE POLICY "Consumers can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = consumer_id);
CREATE POLICY "Participants can update order status" ON public.orders
  FOR UPDATE USING (auth.uid() = consumer_id OR auth.uid() = farmer_id);

-- Order Items Policies
CREATE POLICY "Order items viewable by order participants" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (o.consumer_id = auth.uid() OR o.farmer_id = auth.uid())
    )
  );

-- Worker Jobs Policies
CREATE POLICY "Open jobs viewable by everyone" ON public.worker_jobs
  FOR SELECT USING (true);
CREATE POLICY "Farmers can manage own jobs" ON public.worker_jobs
  FOR ALL USING (auth.uid() = farmer_id);

-- Worker Applications Policies
CREATE POLICY "Workers view own applications, farmers view applications for their jobs" ON public.worker_applications
  FOR SELECT USING (
    auth.uid() = worker_id OR
    EXISTS (SELECT 1 FROM public.worker_jobs j WHERE j.id = worker_applications.job_id AND j.farmer_id = auth.uid())
  );
CREATE POLICY "Workers can submit applications" ON public.worker_applications
  FOR INSERT WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "Farmers can update application status" ON public.worker_applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.worker_jobs j WHERE j.id = worker_applications.job_id AND j.farmer_id = auth.uid())
  );

-- Market Prices Policies
CREATE POLICY "Market prices viewable by all" ON public.market_prices
  FOR SELECT USING (true);

-- Weather Policies
CREATE POLICY "Weather viewable by all" ON public.weather_cache
  FOR SELECT USING (true);

-- Articles Policies
CREATE POLICY "Published articles viewable by all" ON public.articles
  FOR SELECT USING (is_published = true);

-- Notifications Policies
CREATE POLICY "Users can view and manage their own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- Reviews Policies
CREATE POLICY "Reviews viewable by everyone" ON public.reviews
  FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
