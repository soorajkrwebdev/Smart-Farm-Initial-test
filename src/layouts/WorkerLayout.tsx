import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  ClipboardList, 
  DollarSign, 
  User 
} from 'lucide-react';

export const WorkerLayout: React.FC = () => {
  const { user } = useAuth();

  const workerNav = [
    { label: 'Work Overview', to: '/worker/dashboard', icon: LayoutDashboard },
    { label: 'Browse Farm Jobs', to: '/worker/jobs', icon: Briefcase },
    { label: 'My Applications', to: '/worker/applications', icon: ClipboardList },
    { label: 'Daily Earnings', to: '/worker/earnings', icon: DollarSign },
    { label: 'Skills & Profile', to: '/worker/profile', icon: User },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-gradient-to-r from-amber-900 to-amber-950 text-white rounded-2xl p-5 mb-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-800 border border-amber-600 flex items-center justify-center font-bold text-lg text-amber-200">
              👷
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{user?.name || 'Worker'}</h1>
                <span className="bg-emerald-600/80 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  Available for Work
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-0.5">
                Location: {user?.village_town || 'Puttur'}, {user?.district || 'Dakshina Kannada'} • Expected Rate: ₹850/day
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200 pb-3 mb-6 overflow-x-auto scrollbar-none">
        {workerNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/worker/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                isActive
                  ? 'bg-amber-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-amber-900 hover:bg-amber-50'
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
