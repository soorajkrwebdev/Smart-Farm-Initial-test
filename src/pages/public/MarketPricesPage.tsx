import React, { useState, useEffect } from 'react';
import { marketPriceService, MarketPriceResult } from '../../services/marketPriceService';
import { KARNATAKA_LOCATIONS } from '../../lib/constants';
import { formatINR, formatDate } from '../../lib/utils';
import { TrendingUp, Search, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const MarketPricesPage: React.FC = () => {
  const [result, setResult] = useState<MarketPriceResult | null>(null);
  const [commodityFilter, setCommodityFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrices = async () => {
    setIsLoading(true);
    try {
      const res = await marketPriceService.getMarketPrices(
        commodityFilter || undefined,
        districtFilter !== 'all' ? districtFilter : undefined
      );
      setResult(res);
    } catch (e) {
      console.error('Failed to load market prices:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, [commodityFilter, districtFilter]);

  const chartData = (result?.data || []).map((p) => ({
    name: p.commodity.split(' ')[0],
    modal: p.modal_price,
    market: p.market,
  }));

  const COLORS = ['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
              APMC Mandi Market Prices
            </h1>
            <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Reference Benchmarks
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track daily wholesale commodity arrivals, min/max spreads, and modal rates across Karnataka APMC mandis.
          </p>
        </div>

        <button
          onClick={fetchPrices}
          className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Source & Provenance Badge */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-900 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Source: {result?.source}</span>
        </div>
        <div className="text-emerald-700 text-[11px]">
          Last fetched: {result?.lastUpdated ? formatDate(result.lastUpdated) : 'Live'}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search commodity (e.g. Pepper, Arecanut, Coconut)..."
            value={commodityFilter}
            onChange={(e) => setCommodityFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-gray-700 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
        >
          <option value="all">All Karnataka Districts</option>
          {KARNATAKA_LOCATIONS.map((l) => (
            <option key={l.district} value={l.district}>{l.district}</option>
          ))}
        </select>
      </div>

      {/* Modal Price Bar Chart */}
      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <span>Mandi Modal Price Comparison (₹ per Unit)</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`₹${value}`, 'Modal Benchmark']}
                  labelFormatter={(name) => `Commodity: ${name}`}
                />
                <Bar dataKey="modal" radius={[8, 8, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
              <tr>
                <th className="p-4">Commodity & Variety</th>
                <th className="p-4">APMC Mandi</th>
                <th className="p-4">District</th>
                <th className="p-4 text-right">Min Price</th>
                <th className="p-4 text-right">Max Price</th>
                <th className="p-4 text-right">Modal Rate</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(result?.data || []).map((row) => (
                <tr key={row.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-gray-900 block">{row.commodity}</span>
                    <span className="text-[11px] text-gray-400">{row.variety || 'Standard'}</span>
                  </td>
                  <td className="p-4 text-gray-700 font-medium">{row.market}</td>
                  <td className="p-4 text-gray-500">{row.district}</td>
                  <td className="p-4 text-right text-gray-600">₹{row.min_price}</td>
                  <td className="p-4 text-right text-gray-600">₹{row.max_price}</td>
                  <td className="p-4 text-right font-extrabold text-emerald-950">
                    ₹{row.modal_price} <span className="text-[10px] text-gray-400 font-normal">/{row.unit}</span>
                  </td>
                  <td className="p-4 text-gray-500 whitespace-nowrap">{formatDate(row.price_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Disclaimer (Specification #23 & #92) */}
      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-start gap-2.5 text-xs text-gray-500 leading-relaxed">
        <AlertCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        <p>
          <strong>Reference Price Notice:</strong> Reference prices are sourced from official open market bulletins (AGMARKNET) and CAMPCO. Mandi prices serve as indicative regional benchmarks and are not guaranteed sales receipts. Farmgate prices may vary based on moisture, drying standards, grade quality, variety, and market transaction costs.
        </p>
      </div>
    </div>
  );
};
