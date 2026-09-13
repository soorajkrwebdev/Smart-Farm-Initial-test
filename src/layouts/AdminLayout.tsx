import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  BookOpen, 
  Settings 
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const adminNav = [
    { label: 'Overview', to: '/admin', icon: LayoutDashboard },
    { label: 'Verification Queue', to: '/admin/verification', icon: ShieldCheck },
    { label: 'Moderate Products', to: '/admin/products', icon: Package },
    { label: 'All Orders', to: '/admin/orders', icon: ClipboardList },
    { label: 'User Directory', to: '/admin/users', icon: Users },
    { label: 'Mandi API Health', to: '/admin/market-prices', icon: TrendingUp },
    { label: 'Articles & Schemes', to: '/admin/articles', icon: BookOpen },
    { label: 'Disputes & Reports', to: '/admin/reports', icon: AlertTriangle },
    { label: 'System Settings', to: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-2xl p-5 mb-6 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center font-bold text-lg text-emerald-200">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Admin Console</h1>
              <span className="bg-red-500/80 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                Superuser Access
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Smart Farm Ecosystem Monitoring & Governance Control
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200 pb-3 mb-6 overflow-x-auto scrollbar-none">
        {adminNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-slate-900 hover:bg-slate-100'
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
