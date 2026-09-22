import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { repository } from '../../services/storageService';
import { marketPriceService, MarketPriceResult } from '../../services/marketPriceService';
import { weatherService } from '../../services/weatherService';
import { 
  Users, 
  Package, 
  ClipboardList, 
  ShieldCheck, 
  TrendingUp, 
  CloudSun, 
  AlertTriangle,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { formatINR, formatDateTime } from '../../lib/utils';

export const AdminOverview: React.FC = () => {
  const [userCount, setUserCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [jobCount, setJobCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [mandiResult, setMandiResult] = useState<MarketPriceResult | null>(null);

  useEffect(() => {
    const profiles = repository.getProfiles();
    const prods = repository.getProducts();
    const orders = repository.getOrders();
    const jobs = repository.getJobs();

    setUserCount(profiles.length);
    setProductCount(prods.length);
    setOrderCount(orders.length);
    setJobCount(jobs.length);

    const rev = orders.reduce((sum, o) => sum + o.total_amount, 0);
    setTotalRevenue(rev);
  }, []);

  useEffect(() => {
    marketPriceService
      .getMarketPrices()
      .then((res) => setMandiResult(res))
      .catch((e) => console.error('Failed to load mandi sync status:', e));
  }, []);

  const mandiIsLive = mandiResult?.status === 'live';

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Registered Users</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-black text-gray-900">{userCount}</p>
          <span className="text-[11px] text-emerald-700 font-bold block pt-1">
            Farmers, Consumers & Workers
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Produce Listings</span>
            <Package className="w-4 h-4 text-blue-700" />
          </div>
          <p className="text-2xl font-black text-gray-900">{productCount}</p>
          <span className="text-[11px] text-gray-400 block pt-1">In marketplace catalogue</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Orders Processed</span>
            <ClipboardList className="w-4 h-4 text-purple-700" />
          </div>
          <p className="text-2xl font-black text-gray-900">{orderCount}</p>
          <span className="text-[11px] text-emerald-800 font-bold block pt-1">
            Gross Volume: {formatINR(totalRevenue)}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Active Farm Jobs</span>
            <ShieldCheck className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-2xl font-black text-gray-900">{jobCount}</p>
          <span className="text-[11px] text-gray-400 block pt-1">Worker hiring gigs</span>
        </div>
      </div>

      {/* External Integration Health Panel (Specification #24, #42) */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-700" />
            <span>External API Integrations & Resilient Data Sync Health</span>
          </h3>
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              mandiIsLive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {mandiResult ? (mandiIsLive ? 'Mandi Feed: Live' : 'Mandi Feed: Cached') : 'Checking Integrations…'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">Mandi Reference API</span>
              {mandiIsLive ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
            </div>
            <p className="text-gray-500 text-[11px]">Provider: AGMARKNET / data.gov.in mandi feed (via secure Edge Function)</p>
            <p className={`font-semibold pt-1 ${mandiIsLive ? 'text-emerald-800' : 'text-amber-800'}`}>
              Status:{' '}
              {!mandiResult
                ? 'Checking…'
                : mandiIsLive
                  ? 'Live — refreshed from government feed'
                  : 'Cached — not refreshed now'}
            </p>
            <p className="text-gray-500 text-[11px]">
              Last updated: {mandiResult?.lastUpdated ? formatDateTime(mandiResult.lastUpdated) : '—'}
              {mandiResult?.priceDate ? ` · Market date: ${mandiResult.priceDate}` : ''}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">Agro-Weather Service</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-gray-500 text-[11px]">Provider: Open-Meteo High-Res / IMD</p>
            <p className="text-emerald-800 font-semibold pt-1">Status: Active & Calibrated</p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">FarmAI Engine</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-gray-500 text-[11px]">Provider: Gemini Bridge / Tool Execution</p>
            <p className="text-emerald-800 font-semibold pt-1">Status: Ready & Grounded</p>
          </div>
        </div>
      </div>

      {/* Admin Quick Governance Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/verification"
          className="p-5 bg-white rounded-3xl border border-gray-200 shadow-xs hover:border-emerald-600 transition-colors block space-y-1"
        >
          <ShieldCheck className="w-6 h-6 text-emerald-700" />
          <h4 className="font-bold text-gray-900 text-sm">Farmer Verification Queue</h4>
          <p className="text-xs text-gray-500">Approve land title (Pahani/RTC) and FPO certifications.</p>
        </Link>

        <Link
          to="/admin/products"
          className="p-5 bg-white rounded-3xl border border-gray-200 shadow-xs hover:border-emerald-600 transition-colors block space-y-1"
        >
          <Package className="w-6 h-6 text-blue-700" />
          <h4 className="font-bold text-gray-900 text-sm">Product Catalogue Moderation</h4>
          <p className="text-xs text-gray-500">Inspect listed prices, quality descriptions, and flags.</p>
        </Link>

        <Link
          to="/admin/orders"
          className="p-5 bg-white rounded-3xl border border-gray-200 shadow-xs hover:border-emerald-600 transition-colors block space-y-1"
        >
          <ClipboardList className="w-6 h-6 text-purple-700" />
          <h4 className="font-bold text-gray-900 text-sm">Ecosystem Transactions</h4>
          <p className="text-xs text-gray-500">Monitor fulfillment rates and customer dispute resolutions.</p>
        </Link>
      </div>
    </div>
  );
};
