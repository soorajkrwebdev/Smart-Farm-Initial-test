import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { marketPriceService, MarketPriceResult } from '../../services/marketPriceService';
import { weatherService } from '../../services/weatherService';
import { Product, WeatherData } from '../../types';
import { formatUnitPrice, formatDate, formatDateTime } from '../../lib/utils';
import { 
  Package, 
  TrendingUp, 
  CloudSun, 
  Users, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Star,
  CheckCircle2
} from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const ConsumerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [featuredProduce, setFeaturedProduce] = useState<Product[]>([]);
  const [mandiResult, setMandiResult] = useState<MarketPriceResult | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const mandiPrices = mandiResult ? mandiResult.data.slice(0, 4) : [];
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [prods, mandi, w] = await Promise.all([
        productService.getProducts(),
        marketPriceService.getMarketPrices(),
        weatherService.getWeatherForDistrict(user?.district || 'Dakshina Kannada'),
      ]);
      setFeaturedProduce(prods.slice(0, 3));
      setMandiResult(mandi);
      setWeather(w);
    }
    load();
  }, [user]);

  const handleAddToCart = (p: Product) => {
    addItem(p, 1);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="space-y-8">
      {/* Recommended Fresh Harvest */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recommended Produce Near You</h2>
            <p className="text-xs text-gray-500">Chemical-free harvest from verified growers in {user?.district || 'Karnataka'}</p>
          </div>
          <Link to="/marketplace" className="text-xs font-bold text-emerald-800 hover:underline">
            View All Produce &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {featuredProduce.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <img src={prod.images[0]} alt={prod.name} className="w-full h-40 object-cover" />
                <div className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>{prod.farmer_name}</span>
                    <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                      <Star className="w-3 h-3 fill-amber-500" />
                      {prod.farmer_rating}
                    </span>
                  </div>
                  <Link to={`/product/${prod.id}`}>
                    <h4 className="text-sm font-bold text-gray-900 hover:text-emerald-800 line-clamp-1">
                      {prod.name}
                    </h4>
                  </Link>
                  <p className="text-xs font-black text-emerald-950">
                    {formatUnitPrice(prod.price, prod.unit)}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() => handleAddToCart(prod)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                    addedId === prod.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                  }`}
                >
                  {addedId === prod.id ? 'Added!' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column: Mandi Reference & Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mandi Rates Snippet */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>{mandiResult?.status === 'live' ? "Today's Mandi Wholesale Reference" : 'Mandi Wholesale Reference (Cached)'}</span>
            </h3>
            <Link to="/market-prices" className="text-xs font-bold text-emerald-800 hover:underline">
              Compare &rarr;
            </Link>
          </div>

          {mandiResult && (
            <p
              className={`text-[10px] font-semibold px-2 py-1 rounded-lg inline-block ${
                mandiResult.status === 'live'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-amber-50 text-amber-800'
              }`}
            >
              {mandiResult.status === 'live' ? 'LIVE · ' : 'CACHED · '}
              Last updated: {mandiResult.lastUpdated ? formatDateTime(mandiResult.lastUpdated) : '—'}
              {mandiResult.priceDate ? ` · Market date: ${formatDate(mandiResult.priceDate)}` : ''}
            </p>
          )}

          <div className="divide-y divide-gray-100 text-xs">
            {mandiPrices.map((m) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 block">{m.commodity}</span>
                  <span className="text-[10px] text-gray-400">{m.market}</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-emerald-950">₹{m.modal_price}</span>
                  <span className="text-[10px] text-gray-400 block">/{m.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Local Weather Snippet */}
        {weather && (
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-5 rounded-3xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-bold">Local Weather: {weather.district}</h3>
              </div>
              <span className="text-2xl font-black">{Math.round(weather.current_temp)}°C</span>
            </div>

            <p className="text-xs text-emerald-200/90 leading-relaxed bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/60">
              {weather.condition}. Rain probability: <strong>{weather.rain_probability}%</strong>.
            </p>

            <div className="flex items-center justify-between text-xs text-emerald-300 pt-1">
              <span>Humidity: {weather.humidity}%</span>
              <Link to="/weather" className="font-bold underline text-white">Full Forecast &rarr;</Link>
            </div>
          </div>
        )}
      </div>

      {/* ConsumerAI Assistant Promo */}
      <div className="bg-amber-50 rounded-3xl p-5 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950">Ask Farmlynq Consumer AI</h4>
            <p className="text-xs text-amber-800">"Find organic black pepper under ₹600/kg from Sullia farmers"</p>
          </div>
        </div>
        <Link
          to="/consumer/ai"
          className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition-colors self-start sm:self-auto"
        >
          Ask AI Now
        </Link>
      </div>
    </div>
  );
};
