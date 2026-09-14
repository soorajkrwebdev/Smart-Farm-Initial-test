import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  ClipboardList, 
  Briefcase, 
  Sparkles, 
  TrendingUp, 
  Users, 
  User
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { role, user } = useAuth();
  const { totalCount } = useCart();

  // Role-specific bottom navigation items
  let navItems: { label: string; to: string; icon: React.FC<any>; badge?: number }[] = [];

  if (role === 'farmer') {
    navItems = [
      { label: 'Home', to: '/farmer/dashboard', icon: Home },
      { label: 'Produce', to: '/farmer/products', icon: Package },
      { label: 'Orders', to: '/farmer/orders', icon: ClipboardList },
      { label: 'Workers', to: '/farmer/workers', icon: Users },
      { label: 'FarmAI', to: '/farmer/ai', icon: Sparkles },
    ];
  } else if (role === 'consumer') {
    navItems = [
      { label: 'Home', to: '/consumer/dashboard', icon: Home },
      { label: 'Shop', to: '/marketplace', icon: Package },
      { label: 'Cart', to: '/consumer/cart', icon: ShoppingCart, badge: totalCount },
      { label: 'Orders', to: '/consumer/orders', icon: ClipboardList },
      { label: 'FarmAI', to: '/consumer/ai', icon: Sparkles },
    ];
  } else if (role === 'worker') {
    navItems = [
      { label: 'Home', to: '/worker/dashboard', icon: Home },
      { label: 'Jobs', to: '/worker/jobs', icon: Briefcase },
      { label: 'Applied', to: '/worker/applications', icon: ClipboardList },
      { label: 'Profile', to: '/worker/profile', icon: User },
    ];
  } else if (role === 'admin') {
    navItems = [
      { label: 'Overview', to: '/admin', icon: Home },
      { label: 'Products', to: '/admin/products', icon: Package },
      { label: 'Orders', to: '/admin/orders', icon: ClipboardList },
      { label: 'Verification', to: '/admin/verification', icon: Users },
    ];
  } else {
    // Guest / Public - Minimal navigation
    navItems = [
      { label: 'Home', to: '/', icon: Home },
    ];
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200/90 shadow-lg px-2 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-800 font-bold'
                  : 'text-gray-500 hover:text-gray-900 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-emerald-800' : ''}`} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-emerald-700 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'text-emerald-900 font-bold' : 'text-gray-600'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-700" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};
