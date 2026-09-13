import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, PhoneCall, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-emerald-950 text-emerald-100/90 pt-12 pb-24 lg:pb-12 border-t border-emerald-900/60 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-emerald-900/80">
          {/* Brand & Vision */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white">
                <Sprout className="w-5 h-5 text-emerald-200" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                SMART<span className="text-emerald-400">FARM</span>
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed max-w-sm">
              "From Farm to Market, Everything in One Place."
              An integrated digital ecosystem empowering Indian farmers with direct customer trade, fair mandi market reference prices, skilled agricultural labour, and precision FarmAI guidance.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-emerald-300">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>National Kisan Call Centre: <strong>1800-180-1551</strong></span>
            </div>
          </div>

          {/* For Farmers */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">For Farmers</h4>
            <ul className="space-y-2 text-xs text-emerald-200/70">
              <li><Link to="/farmer/products/new" className="hover:text-white transition-colors">List Your Harvest</Link></li>
              <li><Link to="/farmer/market-prices" className="hover:text-white transition-colors">Compare Mandi Prices</Link></li>
              <li><Link to="/farmer/jobs" className="hover:text-white transition-colors">Hire Agricultural Labour</Link></li>
              <li><Link to="/weather" className="hover:text-white transition-colors">District Weather Advisory</Link></li>
              <li><Link to="/articles" className="hover:text-white transition-colors">Govt Subsidies & Schemes</Link></li>
              <li><Link to="/farmer/ai" className="hover:text-white transition-colors">Ask FarmAI Assistant</Link></li>
            </ul>
          </div>

          {/* For Consumers */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">For Consumers</h4>
            <ul className="space-y-2 text-xs text-emerald-200/70">
              <li><Link to="/marketplace" className="hover:text-white transition-colors">Fresh Farm Produce</Link></li>
              <li><Link to="/farmers" className="hover:text-white transition-colors">Discover Local Farms</Link></li>
              <li><Link to="/market-prices" className="hover:text-white transition-colors">Fair Price Transparency</Link></li>
              <li><Link to="/consumer/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
              <li><Link to="/consumer/orders" className="hover:text-white transition-colors">Track Orders</Link></li>
            </ul>
          </div>

          {/* Workforce & Platform */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Agricultural Workforce</h4>
            <ul className="space-y-2 text-xs text-emerald-200/70">
              <li><Link to="/workers" className="hover:text-white transition-colors">Skilled Farm Workers</Link></li>
              <li><Link to="/jobs" className="hover:text-white transition-colors">Daily Wage Farm Jobs</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Join as Farm Worker</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Administration Portal</Link></li>
            </ul>
          </div>
        </div>

        {/* Data Provenance & Legal Disclaimers */}
        <div className="pt-6 pb-2 text-[11px] text-emerald-300/70 space-y-2 leading-relaxed">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong>Official Data Attribution:</strong> Mandi benchmark reference prices are collected in accordance with public bulletins from AGMARKNET and the Open Government Data Platform (data.gov.in). Meteorological advisories are based on IMD / Open-Meteo regional models. Reference prices serve as indicative market benchmarks and may fluctuate with quality, grading, and local auction arrivals.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-emerald-900/40 text-emerald-400/80">
            <p>© 2026 FarmNexa Ecosystem. Built for sustainable Indian agriculture.</p>
            <p className="flex items-center gap-1 mt-2 sm:mt-0">
              <span>Karnataka Agri-Tech Initiative</span>
              <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
