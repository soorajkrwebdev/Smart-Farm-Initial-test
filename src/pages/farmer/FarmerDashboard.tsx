import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { marketPriceService } from '../../services/marketPriceService';
import { weatherService } from '../../services/weatherService';
import { Product, Order, MarketPrice, WeatherData } from '../../types';
import { formatINR, formatUnitPrice } from '../../lib/utils';
import { 
  Package, 
  ClipboardList, 
  TrendingUp, 
  CloudSun, 
  Users, 
  PlusCircle, 
  Sparkles, 
  AlertTriangle, 
  ArrowRight,
  Briefcase
} from 'lucide-react';

export const FarmerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [mandiPrices, setMandiPrices] = useState<MarketPrice[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    async function load() {
      if (user) {
        const [myProds, myOrders, mandi, w] = await Promise.all([
          productService.getProducts({ farmerId: user.id }),
          orderService.getOrders({ farmerId: user.id }),
          marketPriceService.getMarketPrices(),
          weatherService.getWeatherForDistrict(user.district || 'Dakshina Kannada'),
        ]);
        setProducts(myProds);
        setOrders(myOrders);
        setMandiPrices(mandi.data.slice(0, 3));
        setWeather(w);
      }
    }
    load();
  }, [user]);

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const totalSalesRevenue = orders
    .filter((o) => o.status === 'completed' || o.status === 'accepted')
    .reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="space-y-8">
      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Active Produce</span>
            <Package className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-black text-gray-900">{products.length}</p>
          <Link to="/farmer/products" className="text-[11px] text-emerald-800 font-bold hover:underline block pt-1">
            Manage inventory &rarr;
          </Link>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Orders Received</span>
            <ClipboardList className="w-4 h-4 text-blue-700" />
          </div>
          <p className="text-2xl font-black text-gray-900">{orders.length}</p>
          <span className="text-[11px] text-amber-700 font-bold block pt-1">
            {pendingOrders.length} pending approval
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Realized Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-black text-emerald-950">{formatINR(totalSalesRevenue)}</p>
          <span className="text-[11px] text-gray-400 block pt-1">Direct from customers</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Harvest Workforce</span>
            <Users className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-2xl font-black text-gray-900">4</p>
          <Link to="/farmer/workers" className="text-[11px] text-amber-800 font-bold hover:underline block pt-1">
            Find nearby climbers &rarr;
          </Link>
        </div>
      </div>

      {/* 2-Column: Market Intelligence & Weather Today */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Market Intelligence */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>Market Intelligence: Mandi Benchmarks</span>
            </h3>
            <Link to="/farmer/market-prices" className="text-xs font-bold text-emerald-800 hover:underline">
              Full Mandi Board &rarr;
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {mandiPrices.map((p) => {
              const myProduct = products.find((mp) =>
                mp.name.toLowerCase().includes(p.commodity.toLowerCase()) ||
                p.commodity.toLowerCase().includes(mp.name.toLowerCase())
              );
              return (
                <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-gray-900">{p.commodity}</h4>
                    <p className="text-[11px] text-gray-400">{p.market} • Modal: ₹{p.modal_price}/{p.unit}</p>
                  </div>
                  <div className="text-right">
                    {myProduct ? (
                      <div>
                        <span className="font-extrabold text-emerald-950 block">Your: ₹{myProduct.price}/{myProduct.unit}</span>
                        <span className={`text-[10px] font-bold ${myProduct.price <= p.modal_price ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {myProduct.price <= p.modal_price ? '✓ Competitive Price' : 'Premium Grade'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400">Not listed yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weather Today */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-6 rounded-3xl shadow-xs space-y-4">
          {weather && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CloudSun className="w-5 h-5 text-amber-300" />
                  <h3 className="text-sm font-bold">Weather: {weather.district}</h3>
                </div>
                <span className="text-3xl font-black">{Math.round(weather.current_temp)}°C</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 text-xs space-y-1">
                <span className="font-bold text-amber-300 block">🌾 Farm Planning Recommendation:</span>
                <p className="text-emerald-100/90 leading-relaxed text-[11px]">
                  {weather.agricultural_advisory}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-emerald-300 pt-1">
                <span>Rain Chance: <strong>{weather.rain_probability}%</strong></span>
                <span>Humidity: <strong>{weather.humidity}%</strong></span>
                <Link to="/farmer/weather" className="font-bold underline text-white">7-Day &rarr;</Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Action Hub (Specification #12 & #41) */}
      <div className="bg-emerald-50/70 p-6 rounded-3xl border border-emerald-200">
        <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-4">
          Quick Farm Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/farmer/products/new"
            className="p-4 bg-white rounded-2xl border border-emerald-200 text-center hover:bg-emerald-100/60 transition-all group shadow-xs"
          >
            <PlusCircle className="w-5 h-5 mx-auto mb-1.5 text-emerald-800 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-gray-900 block">+ Add Produce</span>
            <span className="text-[10px] text-gray-400">List new harvest</span>
          </Link>

          <Link
            to="/farmer/jobs"
            className="p-4 bg-white rounded-2xl border border-emerald-200 text-center hover:bg-emerald-100/60 transition-all group shadow-xs"
          >
            <Briefcase className="w-5 h-5 mx-auto mb-1.5 text-amber-700 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-gray-900 block">+ Post Job</span>
            <span className="text-[10px] text-gray-400">Hire climbers/labour</span>
          </Link>

          <Link
            to="/farmer/market-prices"
            className="p-4 bg-white rounded-2xl border border-emerald-200 text-center hover:bg-emerald-100/60 transition-all group shadow-xs"
          >
            <TrendingUp className="w-5 h-5 mx-auto mb-1.5 text-blue-700 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-gray-900 block">Mandi Prices</span>
            <span className="text-[10px] text-gray-400">Compare rates</span>
          </Link>

          <Link
            to="/farmer/ai"
            className="p-4 bg-white rounded-2xl border border-emerald-200 text-center hover:bg-emerald-100/60 transition-all group shadow-xs"
          >
            <Sparkles className="w-5 h-5 mx-auto mb-1.5 text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-gray-900 block">Ask FarmAI</span>
            <span className="text-[10px] text-gray-400">Crop & price assistant</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
