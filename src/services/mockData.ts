import {
  UserProfile, FarmerProfile, ConsumerProfile, WorkerProfile,
  Product, Order, WorkerJob, WorkerApplication, MarketPrice,
  WeatherData, Article, AppNotification, Review
} from '../types';

const NOW = new Date().toISOString();

export const INITIAL_PROFILES: (UserProfile | FarmerProfile | ConsumerProfile | WorkerProfile)[] = [];
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_JOBS: WorkerJob[] = [];
export const INITIAL_APPLICATIONS: WorkerApplication[] = [];
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
export const INITIAL_REVIEWS: Review[] = [];

export const INITIAL_MARKET_PRICES: MarketPrice[] = [
  { id: 'mp-1', commodity: 'Arecanut (Betelnut)', variety: 'Red / Sagu (Chal)', market: 'Sullia APMC Mandi', district: 'Dakshina Kannada', state: 'Karnataka', min_price: 420, max_price: 520, modal_price: 485, unit: 'kg', price_date: new Date().toISOString().slice(0, 10), source: 'CAMPCO / APMC Sullia Bulletin', source_url: 'https://campco.org', fetched_at: NOW },
  { id: 'mp-2', commodity: 'Arecanut', variety: 'Batta / White Chali', market: 'Mangaluru APMC', district: 'Dakshina Kannada', state: 'Karnataka', min_price: 380, max_price: 470, modal_price: 430, unit: 'kg', price_date: new Date().toISOString().slice(0, 10), source: 'AGMARKNET Karnataka Mandi Bulletin', source_url: 'https://agmarknet.gov.in', fetched_at: NOW },
  { id: 'mp-3', commodity: 'Black Pepper', variety: 'Malabar Bold 550 g/L', market: 'Sullia CAMPCO Mandi', district: 'Dakshina Kannada', state: 'Karnataka', min_price: 680, max_price: 760, modal_price: 720, unit: 'kg', price_date: new Date().toISOString().slice(0, 10), source: 'Spices Board India Auction Summary', source_url: 'https://spicesboard.in', fetched_at: NOW },
  { id: 'mp-4', commodity: 'Cocoa Beans', variety: 'Fermented & Sun-dried', market: 'CAMPCO Puttur Mandi', district: 'Dakshina Kannada', state: 'Karnataka', min_price: 340, max_price: 395, modal_price: 372, unit: 'kg', price_date: new Date().toISOString().slice(0, 10), source: 'CAMPCO Weekly Buyback Rates', source_url: 'https://campco.org', fetched_at: NOW },
  { id: 'mp-5', commodity: 'Coconut', variety: 'Medium Dehusked', market: 'Udupi APMC', district: 'Udupi', state: 'Karnataka', min_price: 28, max_price: 38, modal_price: 33, unit: 'piece', price_date: new Date().toISOString().slice(0, 10), source: 'Udupi Coconut Growers Federation', source_url: 'https://agmarknet.gov.in', fetched_at: NOW },
  { id: 'mp-6', commodity: 'Copra', variety: 'Ball Copra Edible', market: 'Mangaluru APMC', district: 'Dakshina Kannada', state: 'Karnataka', min_price: 210, max_price: 250, modal_price: 235, unit: 'kg', price_date: new Date().toISOString().slice(0, 10), source: 'AGMARKNET Karnataka', source_url: 'https://agmarknet.gov.in', fetched_at: NOW },
  { id: 'mp-7', commodity: 'Coffee (Arabica Plantation A)', variety: 'Plantation AA parchment', market: 'Coffee Board Chikkamagaluru', district: 'Chikkamagaluru', state: 'Karnataka', min_price: 780, max_price: 920, modal_price: 850, unit: 'kg', price_date: new Date().toISOString().slice(0, 10), source: 'Coffee Board of India Weekly Auction', source_url: 'https://indiacoffee.org', fetched_at: NOW },
  { id: 'mp-8', commodity: 'Coffee (Robusta Cherry)', variety: 'Robusta Cherry AB', market: 'Coffee Board Chikkamagaluru', district: 'Chikkamagaluru', state: 'Karnataka', min_price: 410, max_price: 495, modal_price: 445, unit: 'kg', price_date: new Date().toISOString().slice(0, 10), source: 'Coffee Board of India Weekly Auction', source_url: 'https://indiacoffee.org', fetched_at: NOW },
  { id: 'mp-9', commodity: 'Green Cardamom', variety: '8mm Bold', market: 'Hassan APMC Cardamom', district: 'Hassan', state: 'Karnataka', min_price: 2800, max_price: 3400, modal_price: 3150, unit: 'kg', price_date: new Date().toISOString().slice(0, 10), source: 'Spices Board E-Auction', source_url: 'https://spicesboard.in', fetched_at: NOW },
  { id: 'mp-10', commodity: 'Cashew Nut (W240)', variety: 'W240 Kernels', market: 'Mangaluru CAMPCO Mandi', district: 'Dakshina Kannada', state: 'Karnataka', min_price: 580, max_price: 700, modal_price: 640, unit: 'kg', price_date: new Date().toISOString().slice(0, 10), source: 'CEPC Export Referential', source_url: 'https://cepc.gov.in', fetched_at: NOW },
  { id: 'mp-11', commodity: 'Paddy (Jaya / Jyothi)', variety: 'Jaya / Jyothi', market: 'Sullia PACS Mandi', district: 'Dakshina Kannada', state: 'Karnataka', min_price: 23.5, max_price: 27.0, modal_price: 25.25, unit: 'kg', price_date: new Date().toISOString().slice(0, 10), source: 'MSP + APMC Mandi', source_url: 'https://agmarknet.gov.in', fetched_at: NOW },
  { id: 'mp-12', commodity: 'Red Rice (Kasaragod)', variety: 'Kasaragod Red', market: 'Sullia FPO Mandi', district: 'Dakshina Kannada', state: 'Karnataka', min_price: 88, max_price: 115, modal_price: 98, unit: 'kg', price_date: new Date().toISOString().slice(0, 10), source: 'Sullia Arecanut Growers FPO', fetched_at: NOW },
  { id: 'mp-13', commodity: 'Banana (Poovan Rasabale)', variety: 'Poovan Rasabale', market: 'Mangaluru HOPCOMs', district: 'Dakshina Kannada', state: 'Karnataka', min_price: 22, max_price: 31, modal_price: 27, unit: 'kg', price_date: new Date().toISOString().slice(0, 10), source: 'HOPCOMS Mangaluru Daily Bulletin', fetched_at: NOW },
  { id: 'mp-14', commodity: 'Brinjal (Mattu Gulla)', variety: 'Mattu Gulla / Udupi', market: 'Udupi HOPCOMs', district: 'Udupi', state: 'Karnataka', min_price: 42, max_price: 62, modal_price: 52, unit: 'kg', price_date: new Date().toISOString().slice(0, 10), source: 'HOPCOMS Udupi', fetched_at: NOW },
  { id: 'mp-15', commodity: 'Orange (Coorg)', variety: 'Sathgudi / Coorg Orange', market: 'APMC Chikkamagaluru', district: 'Chikkamagaluru', state: 'Karnataka', min_price: 44, max_price: 62, modal_price: 55, unit: 'kg', price_date: new Date().toISOString().slice(0, 10), source: 'APMC Chikkamagaluru Mandi', fetched_at: NOW },
  { id: 'mp-16', commodity: 'Turmeric', variety: 'Salem / Erode', market: 'Mysuru APMC Mandi', district: 'Mysuru', state: 'Karnataka', min_price: 145, max_price: 185, modal_price: 165, unit: 'kg', price_date: new Date().toISOString().slice(0, 10), source: 'Erode Turmeric / Mysuru Mandi', source_url: 'https://agmarknet.gov.in', fetched_at: NOW },
];

const TODAY_ISO = new Date();
const DAY = (offset: number) => new Date(TODAY_ISO.getTime() + offset * 86400000).toISOString().slice(0, 10);
const DAY_NAME = (offset: number) => ['Today', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][offset === 0 ? 0 : (new Date(TODAY_ISO.getTime() + offset * 86400000).getDay() + 6) % 7 + 1] || 'Day';

export const INITIAL_WEATHER: WeatherData = {
  district: 'Dakshina Kannada',
  state: 'Karnataka',
  current_temp: 28.5,
  condition: 'Mainly clear with passing clouds',
  feels_like: 31.8,
  humidity: 78,
  wind_speed: 11.5,
  rain_probability: 35,
  rainfall_mm: 0.2,
  uv_index: 7,
  forecast: [
    { date: DAY(0), day_name: 'Today', max_temp: 31.2, min_temp: 24.0, condition: 'Mainly clear with passing clouds', rain_probability: 35, rainfall_mm: 0.2 },
    { date: DAY(1), day_name: DAY_NAME(1), max_temp: 30.8, min_temp: 23.8, condition: 'Partly cloudy', rain_probability: 45, rainfall_mm: 2.5 },
    { date: DAY(2), day_name: DAY_NAME(2), max_temp: 29.5, min_temp: 23.2, condition: 'Scattered monsoon showers', rain_probability: 75, rainfall_mm: 18.4 },
    { date: DAY(3), day_name: DAY_NAME(3), max_temp: 28.9, min_temp: 22.9, condition: 'Moderate rainfall', rain_probability: 85, rainfall_mm: 32.1 },
    { date: DAY(4), day_name: DAY_NAME(4), max_temp: 29.2, min_temp: 23.0, condition: 'Scattered monsoon showers', rain_probability: 65, rainfall_mm: 12.8 },
    { date: DAY(5), day_name: DAY_NAME(5), max_temp: 30.4, min_temp: 23.6, condition: 'Overcast skies', rain_probability: 40, rainfall_mm: 3.6 },
    { date: DAY(6), day_name: DAY_NAME(6), max_temp: 31.8, min_temp: 24.1, condition: 'Partly cloudy', rain_probability: 20, rainfall_mm: 0.0 },
  ],
  alerts: [],
  agricultural_advisory: 'Monitor daily forecast during monsoon harvest periods. Defer pesticide sprays when rainfall probability exceeds 60%. Ensure terrace bunds and drainage channels are cleared for estates located on sloping terrains.',
  updated_at: NOW,
  source: 'Open-Meteo High-Resolution Meteorological Feed / IMD Calibration',
};

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-1',
    title: 'Managing Quick Wilt (Phytophthora) in Malabar Black Pepper Vines',
    slug: 'managing-quick-wilt-black-pepper',
    category: 'Disease Management',
    summary: 'Essential biological and cultural practices to safeguard pepper gardens during post-monsoon humid cycles.',
    content: `Quick wilt, triggered by the soil-borne pathogen *Phytophthora capsici*, is the single greatest risk to black pepper plantations in Dakshina Kannada, Udupi, and Kodagu.

### Symptoms to Monitor:
- Sudden wilting of fresh runner shoots and dark brown water-soaked lesions along leaf margins.
- Blackening and softening of collar regions at ground level.
- Rapid leaf drop leaving bare vines within 7-10 days.

### Preventive Cultural Guidelines:
1. **Soil Aeration & Drainage**: Provide clean peripheral catch-pits along terrace slopes to prevent standing water at palm vine basins.
2. **Trichoderma Soil Enrichment**: Incorporate 5 kg farmyard manure pre-inoculated with *Trichoderma harzianum* around each vine basin during late August and mid-September.
3. **1% Bordeaux Mixture Spray**: Thoroughly drench leaves and vine stems before heavy downpours.
4. **Collar Drenching**: Apply Potassium Phosphonate (Akomin 0.3%) at 3-5 litres per vine basin.`,
    cover_image: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800&h=400&fit=crop',
    author: 'Dr. K. Narayana (Indian Institute of Spices Research, Calicut)',
    official_source: 'ICAR-IISR Agricultural Advisory Bulletin',
    official_url: 'https://spices.res.in',
    is_published: true,
    tags: ['Black Pepper', 'Spices', 'Plant Pathology', 'Karnataka Agriculture'],
    created_at: '2026-08-15T10:00:00Z',
  },
  {
    id: 'art-2',
    title: 'PMKSY Micro-Irrigation Subsidy: How Karnataka Farmers Can Avail 55% to 90% Financial Assistance',
    slug: 'pmksy-micro-irrigation-subsidy-karnataka',
    category: 'Government Schemes',
    summary: 'A step-by-step breakdown of obtaining government subsidies for drip irrigation systems and solar agricultural pumps in 2026.',
    content: `Under the Pradhan Mantri Krishi Sinchayee Yojana (PMKSY - Per Drop More Crop), the Department of Horticulture and Agriculture, Government of Karnataka provides substantial capital subsidies to farmers installing micro-irrigation systems.

### Eligibility & Subsidy Tiers:
- **Small and Marginal Farmers (Up to 5 Acres)**: 90% subsidy for SC/ST farmers; 55% subsidy for General Category farmers.
- **Other Farmers (> 5 Acres)**: 45% standard subsidy up to a maximum ceiling of 12.5 acres per family.

### Required Documentation:
- Record of Rights, Tenancy and Crops (Pahani / RTC) updated for the current agricultural year.
- Valid Aadhaar card linked to bank account with NPCI mapper enabled.
- Soil and Water Testing Report from registered Taluk Krishi Vignana Kendra (KVK).
- Detailed estimate map from approved empanelled drip manufacturer (Jain, Netafim, EPC, etc.).

### Application Procedure:
Applications are submitted online through the Karnataka Farmer Portal (FRUITS: Farmer Registration and Unified Beneficiary Information System).`,
    cover_image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=400&fit=crop',
    author: 'State Horticulture Mission, Govt of Karnataka',
    official_source: 'Dept of Agriculture, Government of Karnataka',
    official_url: 'https://fruits.karnataka.gov.in',
    is_published: true,
    tags: ['Subsidies', 'Government Schemes', 'Drip Irrigation', 'FRUITS Portal'],
    created_at: '2026-08-20T11:00:00Z',
  },
  {
    id: 'art-3',
    title: 'Arecanut Inter-cropping with Cocoa and Banana for Doubled Acre Revenue',
    slug: 'arecanut-inter-cropping-cocoa-banana',
    category: 'Crop Cultivation',
    summary: 'How multi-tier cropping models maximize land utilization and optimize shade canopy in coastal plantations.',
    content: `Monoculture arecanut gardens utilize only 22% of solar radiation in the early canopy and leave the fertile ground under-utilized. Multi-tier cropping provides year-round steady cash flow.

### The Recommended 3-Tier Model:
- **Top Canopy (Overstorey)**: Arecanut palms spaced at 2.7m x 2.7m.
- **Middle Canopy**: Cocoa (*Theobroma cacao*) planted in alternate rows at 2.7m x 5.4m spacing. High buyback agreements with CAMPCO ensure stable revenue.
- **Lower Canopy & Ground**: Dwarf Cavendish or Nanjangud Rasabale banana suckers planted in every third inter-row for continuous organic mulch and moisture conservation.`,
    cover_image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&h=400&fit=crop',
    author: 'Central Plantation Crops Research Institute (CPCRI, Kasaragod / Vittal)',
    official_source: 'CPCRI Technical Publication Series',
    official_url: 'https://cpcri.icar.gov.in',
    is_published: true,
    tags: ['Arecanut', 'Inter-cropping', 'Cocoa', 'Banana', 'CPCRI'],
    created_at: '2026-08-28T14:00:00Z',
  },
];
