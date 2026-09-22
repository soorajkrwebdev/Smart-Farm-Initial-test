import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserCheck, LogOut, Database, Globe2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { isSupabaseConfigured } from '../../lib/supabase';

export const DemoBanner: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-emerald-900 text-emerald-100 text-xs px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between border-b border-emerald-800/40 z-50 gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="font-bold text-emerald-200 tracking-wide uppercase text-[10px]">
            Farmlynq Platform
          </span>
        </div>

        <span className="hidden sm:inline-block h-3 w-px bg-emerald-800/60" />

        <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">
            Backend:
          </span>
          <span className={`font-semibold ${isSupabaseConfigured ? 'text-emerald-300' : 'text-amber-300'}`}>
            {isSupabaseConfigured ? 'Supabase PostgreSQL + RLS' : 'Local Device Storage (Preview)'}
          </span>
        </div>

        <span className="hidden md:inline-block h-3 w-px bg-emerald-800/60" />

        <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
          <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">
            Karnataka Market Intelligence · 16 Mandi Reference Prices · Open-Meteo Weather
          </span>
          <span className="lg:hidden">
            Karnataka Mandi + Weather
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {user ? (
          <>
            <div className="flex items-center gap-1.5 text-emerald-200">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="hidden md:inline text-[11px]">Signed in:</span>
              <span className="font-semibold text-white capitalize">{user.role}</span>
              {user.name && (
                <span className="text-emerald-300 hidden sm:inline truncate max-w-[140px]">
                  {user.name}
                </span>
              )}
            </div>

            <Link
              to={`/${user.role}/dashboard`}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-800/60 hover:bg-emerald-700/70 text-emerald-100 text-[11px] font-semibold transition-colors border border-emerald-700/40"
            >
              Dashboard
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-800/60 hover:bg-rose-700/70 hover:text-white text-emerald-100 text-[11px] font-semibold transition-colors border border-emerald-700/40 hover:border-rose-700/40"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-[11px] font-semibold transition-colors border border-emerald-700/50"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-50 hover:bg-white text-emerald-900 text-[11px] font-bold transition-colors border border-emerald-400/60 shadow-sm"
            >
              Create Account
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
