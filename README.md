# Farmlynq
> **"From Farm to Market, Everything in One Place."**  
> *Connect. Trade. Work. Learn. Grow.*

Farmlynq is an integrated, scalable, responsive digital agricultural ecosystem connecting **Farmers**, **Consumers**, and **Agricultural Workers**, initially optimized for Karnataka and rural/semi-urban Indian agritech workflows.

---

## 🌾 Core Product Pillars

1. **Direct Farmer-to-Consumer Marketplace**: Eliminates intermediaries, offering fair prices, transparent grades, harvest dates, and organic verification badges.
2. **Multi-Farmer Grouped Shopping Cart & Orders**: Realistic order splitting across distinct growers with snapshot pricing, inventory reservation, and order status timelines.
3. **Agricultural Workforce Marketplace**: Connects plantation and farm owners with skilled labour (Arecanut tree climbing, pepper harvesting, tractor operation, spraying) at transparent daily rates.
4. **Mandi Market Price Intelligence**: AGMARKNET / Open Government Data India benchmarks with transparent source labeling (LIVE vs. CACHED, with real last-updated timestamps), APMC modal rates, and price comparison analytics.
5. **District Agro-Weather System**: 7-day meteorological forecasts, rainfall warnings, and actionable farm planning advisories (spraying windows, drying yard protection).
6. **Farming Knowledge Hub**: Verified crop cultivation guides, pest management bulletins, and official Karnataka government subsidy schemes (PMKSY, KCC).
7. **FarmAI & ConsumerAI Assistants**: Grounded agricultural chatbots equipped with structured tools (`get_market_price`, `get_weather`, `search_products`, `get_farmer_orders`, etc.).
8. **Trust & Verification**: Multi-tiered KYC badges (Unverified, Phone Verified, Profile Verified, Admin Verified, FPO Verified).

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts, Canvas-Confetti.
- **Routing & State**: React Router DOM (v7), Context API (`AuthContext`, `CartContext`, `NotificationContext`, `LocationContext`).
- **Database & Auth**: PostgreSQL / Supabase, Row Level Security (RLS) policies, schema migrations in `supabase/migrations/`.
- **Offline / Demo Resilience**: Local storage-backed transactional repository layer with realistic Karnataka seed data (Sullia, Puttur, Mangaluru, Hassan, Sakleshpur) ensuring out-of-the-box evaluation without requiring immediate external keys.

---

## 📁 Folder Structure

```
smart-farm/
├── public/                # Favicon SVG, PWA manifest
├── src/
│   ├── components/
│   │   ├── common/        # Navbar, Footer, MobileBottomNav, DemoBanner, LocationModal, NotificationDrawer
│   ├── context/           # AuthContext, CartContext, NotificationContext, LocationContext
│   ├── layouts/           # RootLayout, FarmerLayout, ConsumerLayout, WorkerLayout, AdminLayout
│   ├── lib/               # Supabase client, Indian currency & date utils, constants
│   ├── pages/
│   │   ├── public/        # HomePage, MarketplacePage, ProductDetailPage, FarmersPage, WorkersPage, etc.
│   │   ├── farmer/        # FarmerDashboard, FarmerProducts, FarmerAddProduct, FarmerOrders, FarmerJobs, FarmerAIChat
│   │   ├── consumer/      # ConsumerDashboard, ConsumerCart, ConsumerOrders, ConsumerAIChat
│   │   ├── worker/        # WorkerDashboard, WorkerApplications
│   │   └── admin/         # AdminOverview, AdminVerification, AdminProducts, AdminOrders
│   ├── routes/            # AppRoutes, ProtectedRoute (RBAC)
│   ├── services/          # productService, orderService, workerService, marketPriceService, weatherService, aiService, storageService
│   ├── types/             # TypeScript domain definitions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css          # Tailwind v4 theme & component styling
├── supabase/
│   └── migrations/        # PostgreSQL schema DDL with RLS
├── .env.example
├── package.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Farmlynq runs out-of-the-box with `VITE_DEMO_MODE=true`. Supabase credentials and external API keys can be supplied at any time).*

### 3. Run Development Server
```bash
npm run dev
```

### 4. Production Build
```bash
npm run build
npm run preview
```

### 5. Secure Mandi Price Sync (Supabase Edge Function)

Market prices are **never fetched directly from the browser**. The government
(data.gov.in / AGMARKNET) API key lives only in a Supabase secret, and Supabase
remains the application's source of truth:

```
browser → marketPriceService (supabase.functions.invoke) → Edge Function
        → api.data.gov.in (server-side, secret api-key)
        → validate + map → upsert public.market_prices → browser reads Supabase
```

1. **Set the secret** (never a `VITE_*` variable):
   ```bash
   supabase secrets set MARKET_API_KEY=<your data.gov.in api key>
   ```
   Optional overrides: `MARKET_API_BASE_URL`, `MARKET_API_RESOURCE_ID`,
   `MARKET_API_STATE_FILTER`, `MARKET_REFRESH_MIN_INTERVAL_MINUTES`.

2. **Apply the database migration** (de-duplicates existing rows and creates the
   natural unique key used by the upsert):
   ```bash
   supabase db push
   ```

3. **Deploy the function**:
   ```bash
   supabase functions deploy refresh-market-prices --project-ref <your-project-ref>
   ```

4. **Verify**:
   ```bash
   curl -X POST "https://<project-ref>.supabase.co/functions/v1/refresh-market-prices" \
     -H "Authorization: Bearer <anon-or-user-jwt>" \
     -H "Content-Type: application/json" \
     -d '{"force": true}'
   ```

Government resource used: `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`
(“Current Daily Price of Various Commodities from Various Markets (Mandi)”).
The UI distinguishes **LIVE** data (refreshed through the Edge Function now) from
**CACHED** data (previously fetched Supabase rows) and always shows the real
“Last updated” timestamp plus the government bulletin date.

---

## 👥 Demo Profiles for Instant Evaluation

The top **Demo Banner** and **Login Page** include 1-click evaluation buttons:

- **👨‍🌾 Farmer**: Ramesh Gowda (`farmer@farmlynq.in`) — Sullia, Dakshina Kannada (Black Pepper, Arecanut, Banana)
- **🛒 Consumer**: Ananya Rao (`consumer@farmlynq.in`) — Kadri Hills, Mangaluru
- **👷 Worker**: Suresh Poojary (`worker@farmlynq.in`) — Puttur, Dakshina Kannada (Arecanut climber, ₹850/day)
- **🛡️ Admin**: Dr. Vinay Kumar (`admin@farmlynq.in`) — Bengaluru Urban

---

## 🔒 Security & Data Privacy

1. **Row Level Security**: Products, Orders, and Applications are strictly scoped to authenticated user IDs in the Supabase PostgreSQL migration.
2. **Privacy Protection**: Farmer and worker phone numbers and private addresses are obfuscated on public listing views and only disclosed to confirmed transaction participants.
3. **Factual Grounding**: The AI assistant never fabricates live mandi auctions or dangerous pesticide dosages; all answers are grounded in official database queries.
