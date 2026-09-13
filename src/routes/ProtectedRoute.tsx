import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-800 rounded-full animate-spin mb-3" />
        <p className="text-xs text-gray-500 font-medium">Verifying credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If admin, allow access to all or redirect to specific portal
    if (user.role === 'admin') {
      return <>{children}</>;
    }
    // Redirect to their respective dashboard
    const targetDashboard = `/${user.role}/dashboard`;
    return <Navigate to={targetDashboard} replace />;
  }

  return <>{children}</>;
};
