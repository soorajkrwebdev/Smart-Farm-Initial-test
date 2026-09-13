import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  Users, 
  TrendingUp, 
  CloudSun, 
  Sparkles, 
  User, 
  PlusCircle,
  Briefcase
} from 'lucide-react';

export const FarmerLayout: React.FC = () => {
  const { user } = useAuth();

  const farmerNav = [
    { label: 'Overview', to: '/farmer/dashboard', icon: LayoutDashboard },
    { label: 'My Produce', to: '/farmer/products', icon: Package },
    { label: 'Orders', to: '/farmer/orders', icon: ClipboardList },
    { label: 'Find Workers', to: '/farmer/workers', icon: Users },
    { label: 'Post Job', to: '/farmer/jobs', icon: Briefcase },
    { label: 'Mandi Rates', to: '/farmer/market-prices', icon: TrendingUp },
    { label: 'Weather', to: '/farmer/weather', icon: CloudSun },
    { label: 'FarmAI', to: '/farmer/ai', icon: Sparkles },
    { label: 'Farm Profile', to: '/farmer/profile', icon: User },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Farmer Bar */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white rounded-2xl p-5 mb-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-800 border border-emerald-600 flex items-center justify-center font-bold text-lg text-emerald-200">
              👨‍🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">Good morning, {user?.name || 'Farmer'}</h1>
                <span className="bg-emerald-700/80 text-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  FPO Verified
                </span>
              </div>
              <p className="text-xs text-emerald-300/80">
                {user?.village_town || 'Sullia'}, {user?.district || 'Dakshina Kannada'} • Shree Maruthi Organic Estate
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/farmer/products/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-bold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Product</span>
            </Link>
            <Link
              to="/farmer/jobs"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold border border-emerald-600 transition-colors"
            >
              <Briefcase className="w-4 h-4 text-emerald-300" />
              <span>Post Job</span>
            </Link>
            <Link
              to="/farmer/ai"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask FarmAI</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-3 mb-6 overflow-x-auto scrollbar-none">
        {farmerNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/farmer/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-gray-600 hover:text-emerald-900 hover:bg-emerald-50'
              }`
            }
          >
            <item.icon className="w-3.5 h-3.5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
};
