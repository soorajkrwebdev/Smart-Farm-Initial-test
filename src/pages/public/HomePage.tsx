import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sprout, 
  TrendingUp, 
  CloudSun, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight,
  Package,
  Calendar,
  MapPin,
  Star,
  DollarSign,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { marketPriceService, MarketPriceResult } from '../../services/marketPriceService';
import { weatherService } from '../../services/weatherService';
import { Product, WeatherData } from '../../types';
import { formatUnitPrice, formatDate } from '../../lib/utils';
import { useCart } from '../../context/CartContext';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [mandiResult, setMandiResult] = useState<MarketPriceResult | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Only load market and weather data for logged-in users
        if (user) {
          const [prods, mandi, w] = await Promise.all([
            productService.getProducts(),
            marketPriceService.getMarketPrices(),
            weatherService.getWeatherForDistrict('Dakshina Kannada'),
          ]);
          setFeaturedProducts(prods.slice(0, 4));
          setMandiResult(mandi);
          setWeather(w);
        } else {
          // For guests, only load products
          const prods = await productService.getProducts();
          setFeaturedProducts(prods.slice(0, 4));
        }
      } catch (e) {
        console.error('Failed to load homepage feeds:', e);
      }
    }
    loadData();
  }, [user]);

  const handleAddToCart = (e: React.MouseEvent, prod: Product) => {
    e.preventDefault();
    
    // Require login for guests
    if (!user) {
      // Redirect to login
      window.location.href = '/login';
      return;
    }
    
    addItem(prod, 1);
    setAddedId(prod.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="space-y-16 pb-12">
      {/* 1. Mandi Ticker Ribbon - Only for Logged-in Users */}
      {user && mandiResult && mandiResult.data.length > 0 && (
        <div className="bg-emerald-900 text-white overflow-hidden py-2 px-4 shadow-inner border-b border-emerald-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 shrink-0 font-bold text-emerald-300">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {mandiResult.status === 'live'
                  ? 'MANDI BENCHMARKS (LIVE):'
                  : `MANDI BENCHMARKS (CACHED · ${mandiResult.priceDate ? formatDate(mandiResult.priceDate) : 'no date'}):`}
              </span>
            </div>
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-none whitespace-nowrap text-emerald-100">
              {mandiResult.data.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="font-semibold text-white">{m.commodity}:</span>
                  <span className="text-emerald-300 font-bold">₹{m.modal_price}/{m.unit}</span>
                  <span className="text-[10px] text-emerald-400/80">({m.market.split(' ')[0]})</span>
                </div>
              ))}
            </div>
            <Link
              to="/market-prices"
              className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:text-white font-semibold underline shrink-0"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* 2. Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-semibold">
              <Sprout className="w-3.5 h-3.5 text-emerald-700" />
              <span>India's Integrated Agricultural Technology Ecosystem</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-950 tracking-tight leading-[1.1]">
              From Farm to Market, <br />
              <span className="text-emerald-800 underline decoration-emerald-500/40">Everything in One Place.</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl">
              Connect directly with farmers, discover chemical-free fresh produce, compare mandi reference prices (clearly labelled live or cached), find skilled agricultural workers, and plan field operations with <strong>FarmAI</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/marketplace"
                className="px-6 py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 touch-target"
              >
                <Package className="w-4 h-4" />
                <span>Explore Produce</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-gray-50 text-emerald-900 font-bold text-sm border-2 border-emerald-700/60 shadow-xs transition-colors flex items-center gap-2 touch-target"
              >
                <span>Join as Farmer</span>
              </Link>
              <Link
                to="/workers"
                className="px-5 py-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-sm border border-amber-300 transition-colors flex items-center gap-2 touch-target"
              >
                <Users className="w-4 h-4 text-amber-700" />
                <span>Find Farm Workers</span>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200/80 max-w-lg">
              <div>
                <p className="text-xl sm:text-2xl font-black text-emerald-950">₹0</p>
                <p className="text-[11px] text-gray-500 font-medium">Middleman Margin</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-emerald-950">100%</p>
                <p className="text-[11px] text-gray-500 font-medium">Verified Mandi Rates</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-emerald-950">Instant</p>
                <p className="text-[11px] text-gray-500 font-medium">FarmAI Advisory</p>
              </div>
            </div>
          </div>

          {/* Right Hero Card Showcase */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Weather Card */}
            {weather && (
              <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-3xl p-5 shadow-xl border border-emerald-800">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-800/80">
                  <div className="flex items-center gap-2">
                    <CloudSun className="w-5 h-5 text-amber-300" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Agro-Weather Advisory</h4>
                      <p className="text-[10px] text-emerald-300">{weather.district}, {weather.state}</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-white">{Math.round(weather.current_temp)}°C</span>
                </div>

                <div className="mt-3 text-xs text-emerald-100/90 leading-relaxed bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/50">
                  <p className="font-semibold text-amber-300 mb-0.5">🌾 Field Action Tip:</p>
                  <p className="text-[11px]">{weather.agricultural_advisory}</p>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-300">
                  <span>Rain Chance: <strong>{weather.rain_probability}%</strong></span>
                  <span>Humidity: <strong>{weather.humidity}%</strong></span>
                  <Link to="/weather" className="font-bold underline text-white hover:text-emerald-200">
                    7-Day Forecast &rarr;
                  </Link>
                </div>
              </div>
            )}

            {/* FarmAI Teaser Card - Only for Logged-in Users, or Login Prompt for Guests */}
            {user ? (
              <div className="bg-white rounded-3xl p-5 shadow-lg border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Ask FarmAI</h4>
                      <p className="text-[10px] text-gray-500">Instant answers with real mandi & weather data</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                    AI Ready
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-700 italic border border-gray-100">
                  "What is today's reference price for Pepper in Sullia mandi, and can I spray copper sulfate tomorrow?"
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-gray-500">Connected to 10+ Agricultural Tools</span>
                  <Link
                    to="/farmer/ai"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-900"
                  >
                    <span>Launch Assistant</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl p-5 shadow-lg border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Unlock FarmAI Assistant</h4>
                      <p className="text-[10px] text-gray-600">Sign in to access AI-powered farming advice</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl text-xs text-gray-700 border border-amber-200">
                  <p className="font-semibold text-amber-900 mb-1">Get instant answers about:</p>
                  <ul className="text-[11px] text-gray-700 space-y-0.5">
                    <li>• Mandi reference prices for your crops</li>
                    <li>• Weather forecasts & farm advisories</li>
                    <li>• Pest management & fertilizer guidance</li>
                  </ul>
                </div>

                <Link
                  to="/login"
                  className="flex items-center justify-center w-full py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold gap-1.5 transition-colors"
                >
                  <span>Sign In to Access</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. The 3 Ecosystem Pillars: CONNECT. TRADE. WORK. */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">
            Built For Indian Agriculture
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            Connecting Farmers, Consumers, and Rural Workers
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* For Farmers */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xl">
              👨‍🌾
            </div>
            <h4 className="text-lg font-bold text-gray-900">For Farmers</h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Sell your spices, arecanut, and fruits directly to consumers at fair prices. Compare against live APMC mandi benchmarks, recruit skilled climbers, and get AI crop assistance.
            </p>
            <ul className="space-y-2 text-xs text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero commission marketplace</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mandi price comparison engine</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Hire local harvest workers on demand</span>
              </li>
            </ul>
            <Link
              to="/register"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 pt-2"
            >
              <span>Register Your Farm</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* For Consumers */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-teal-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-900 flex items-center justify-center font-bold text-xl">
              🛒
            </div>
            <h4 className="text-lg font-bold text-gray-900">For Consumers</h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Get genuine farm-fresh produce directly from verified farmers. Transparent pricing, organic certification badges, and multi-farmer cart grouping.
            </p>
            <ul className="space-y-2 text-xs text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Direct farmer-to-doorstep freshness</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified farm profiles & reviews</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pay on delivery / pickup options</span>
              </li>
            </ul>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-950 pt-2"
            >
              <span>Browse Fresh Produce</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* For Workers */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xl">
              👷
            </div>
            <h4 className="text-lg font-bold text-gray-900">For Agri Workers</h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Find harvesting, spraying, and tree-climbing jobs in nearby estates. Guarantee fair daily wages, directly contact farmers, and build a verified work profile.
            </p>
            <ul className="space-y-2 text-xs text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>Daily wage transparency (₹750 - ₹1,000/day)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>Nearby farm jobs within your taluk</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>Direct application with 1-click accept</span>
              </li>
            </ul>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 pt-2"
            >
              <span>Explore Farm Jobs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Featured Fresh Produce Showcase */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">Direct From The Estate</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">Fresh Harvest Produce</h3>
          </div>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline"
          >
            <span>View All Produce ({featuredProducts.length}+)</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.is_organic && (
                    <span className="absolute top-3 left-3 bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                      Organic
                    </span>
                  )}
                  <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                    {product.village_town}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span className="truncate">{product.farmer_name}</span>
                    <span className="flex items-center gap-1 text-amber-600 font-bold">
                      <Star className="w-3 h-3 fill-amber-500" />
                      {product.farmer_rating}
                    </span>
                  </div>

                  <Link to={`/product/${product.id}`} className="block">
                    <h4 className="font-bold text-gray-900 text-sm hover:text-emerald-800 line-clamp-2 leading-snug">
                      {product.name}
                    </h4>
                  </Link>

                  {/* Price & Mandi Comparison Badge */}
                  <div className="pt-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-lg font-extrabold text-emerald-950">
                          {formatUnitPrice(product.price, product.unit)}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {product.quantity_available} {product.unit} left
                      </span>
                    </div>

                    {product.mandi_reference_price && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-500 bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-100">
                        <span className="font-semibold text-emerald-900">Mandi Ref: ₹{product.mandi_reference_price}/{product.unit}</span>
                        {product.price < product.mandi_reference_price ? (
                          <span className="text-emerald-700 font-bold ml-auto">
                            ₹{product.mandi_reference_price - product.price} below mandi
                          </span>
                        ) : (
                          <span className="text-gray-500 ml-auto">Fair Farmgate</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0">
                <button
                  onClick={(e) => handleAddToCart(e, product)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 touch-target ${
                    addedId === product.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs'
                  }`}
                >
                  {addedId === product.id ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <span>Add to Cart</span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Trust & Verification Banner */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-teal-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-emerald-800/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Our Core Operating Philosophy</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                Authentic Agricultural Data, Zero Disguised Figures.
              </h3>
              <p className="text-xs sm:text-sm text-emerald-200/80 leading-relaxed">
                Farmlynq never fabricates live mandi auctions or weather observations. Every mandi reference price specifies its APMC origin, reporting date, and quality disclaimer. Our mission is direct farmer empowerment through transparency.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-700/60">
                <h5 className="font-bold text-sm text-white mb-1">AGMARKNET Sourced</h5>
                <p className="text-[11px] text-emerald-300/80">Official Government of India open mandi market datasets.</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-700/60">
                <h5 className="font-bold text-sm text-white mb-1">FPO Verified</h5>
                <p className="text-[11px] text-emerald-300/80">Local Farmer Producer Organizations verified on-site.</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-700/60">
                <h5 className="font-bold text-sm text-white mb-1">Zero Lock-in</h5>
                <p className="text-[11px] text-emerald-300/80">Farmers set their own prices with complete autonomy.</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-700/60">
                <h5 className="font-bold text-sm text-white mb-1">Fair Labour Wage</h5>
                <p className="text-[11px] text-emerald-300/80">Transparent daily rates protecting rural workers.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
