import React, { useState } from 'react';
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLocation } from '../../context/LocationContext';
import { 
  Sprout, 
  ShoppingCart, 
  Bell, 
  MapPin, 
  ChevronDown, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Menu, 
  X, 
  Sparkles,
  Search,
  Briefcase,
  TrendingUp,
  CloudSun,
  BookOpen
} from 'lucide-react';
import { LocationModal } from './LocationModal';
import { NotificationDrawer } from './NotificationDrawer';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const { totalCount } = useCart();
  const { unreadCount } = useNotifications();
  const { district, town } = useLocation();
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getDashboardRoute = () => {
    if (role === 'farmer') return '/farmer/dashboard';
    if (role === 'consumer') return '/consumer/dashboard';
    if (role === 'worker') return '/worker/dashboard';
    if (role === 'admin') return '/admin';
    return '/marketplace';
  };

  const navLinks = [
    { label: 'Marketplace', path: '/marketplace', icon: Sprout },
    { label: 'Mandi Prices', path: '/market-prices', icon: TrendingUp },
    { label: 'Weather', path: '/weather', icon: CloudSun },
    { label: 'Workers', path: '/workers', icon: Briefcase },
    { label: 'Knowledge Hub', path: '/articles', icon: BookOpen },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 -ml-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
                aria-label="Toggle Navigation Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center text-white shadow-md shadow-emerald-900/10 group-hover:scale-105 transition-transform">
                  <Sprout className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-extrabold text-emerald-950 tracking-tight leading-none">
                    Farm<span className="text-emerald-600">Nexa</span>
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-emerald-800/80 font-medium hidden sm:block">
                    Connecting the future of farming
                  </span>
                </div>
              </Link>

              {/* Location Picker Button */}
              <button
                onClick={() => setIsLocationOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-900 text-xs font-medium transition-colors"
                title="Change District / Town"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span className="max-w-[120px] truncate">{town}, {district.replace('Dakshina Kannada', 'DK')}</span>
                <ChevronDown className="w-3 h-3 text-emerald-600 opacity-70" />
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = routerLocation.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-gray-700 hover:text-emerald-900 hover:bg-gray-50'
                    }`}
                  >
                    <link.icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Icons & User Status */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Search Shortcut */}
              <Link
                to="/marketplace"
                className="p-2 text-gray-500 hover:text-emerald-900 hover:bg-gray-100 rounded-lg transition-colors hidden sm:flex"
                title="Search Produce"
              >
                <Search className="w-4 h-4" />
              </Link>

              {/* Notifications */}
              <button
                onClick={() => setIsNotifOpen(true)}
                className="relative p-2 text-gray-600 hover:text-emerald-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="View Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>

              {/* Cart Button */}
              <Link
                to="/consumer/cart"
                className="relative p-2 text-gray-600 hover:text-emerald-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="View Shopping Cart"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {totalCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-700 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {totalCount}
                  </span>
                )}
              </Link>

              {/* Portal / Profile / Login */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all"
                  >
                    <img
                      src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                      alt={user.name}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-emerald-300"
                    />
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-semibold text-gray-900 truncate max-w-[100px]">
                        {user.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] capitalize text-emerald-700 font-medium leading-none">
                        {user.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-900">{user.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                        <span className="mt-1 inline-block text-[10px] font-semibold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded capitalize">
                          {user.role} Profile
                        </span>
                      </div>

                      <Link
                        to={getDashboardRoute()}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-900"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-emerald-700" />
                        <span>My {user.role === 'farmer' ? 'Farmer' : user.role === 'worker' ? 'Worker' : user.role === 'admin' ? 'Admin' : 'Consumer'} Dashboard</span>
                      </Link>

                      <Link
                        to={`/${user.role}/ai`}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-900"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Ask FarmAI Assistant</span>
                      </Link>

                      <Link
                        to={`/${user.role}/profile`}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-900"
                      >
                        <User className="w-3.5 h-3.5 text-gray-500" />
                        <span>Edit Profile</span>
                      </Link>

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={() => {
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs transition-colors"
                  >
                    Join FarmNexa
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
            <button
              onClick={() => {
                setIsLocationOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-medium"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>Location: <strong>{town}, {district}</strong></span>
              </div>
              <span className="text-[11px] text-emerald-700 underline font-semibold">Change</span>
            </button>

            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-800 hover:bg-emerald-50 hover:text-emerald-900"
                >
                  <link.icon className="w-4 h-4 text-emerald-700" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {user && (
              <div className="pt-2 border-t border-gray-100">
                <Link
                  to={getDashboardRoute()}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-900 bg-emerald-50"
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-700" />
                  <span>Go to My {user.role.toUpperCase()} Dashboard</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Modals & Drawers */}
      <LocationModal isOpen={isLocationOpen} onClose={() => setIsLocationOpen(false)} />
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};
