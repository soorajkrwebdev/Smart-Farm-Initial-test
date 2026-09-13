import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  ClipboardList, 
  Heart, 
  Users, 
  TrendingUp, 
  Sparkles, 
  User 
} from 'lucide-react';

export const ConsumerLayout: React.FC = () => {
  const { user } = useAuth();

  const consumerNav = [
    { label: 'Overview', to: '/consumer/dashboard', icon: LayoutDashboard },
    { label: 'Browse Produce', to: '/marketplace', icon: Package },
    { label: 'Cart', to: '/consumer/cart', icon: ShoppingCart },
    { label: 'My Orders', to: '/consumer/orders', icon: ClipboardList },
    { label: 'Saved Farms', to: '/consumer/favorites', icon: Heart },
    { label: 'Local Farmers', to: '/farmers', icon: Users },
    { label: 'Mandi Compare', to: '/market-prices', icon: TrendingUp },
    { label: 'ConsumerAI', to: '/consumer/ai', icon: Sparkles },
    { label: 'Profile', to: '/consumer/profile', icon: User },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-5 mb-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Hello, {user?.name || 'Customer'}</h1>
              <span className="bg-emerald-600/60 text-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                Direct-from-Farmer Member
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 mt-0.5">
              Delivering to: {user?.village_town || 'Mangaluru'}, {user?.district || 'Dakshina Kannada'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200 pb-3 mb-6 overflow-x-auto scrollbar-none">
        {consumerNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/consumer/dashboard'}
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
