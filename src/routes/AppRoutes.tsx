import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { ConsumerLayout } from '../layouts/ConsumerLayout';
import { WorkerLayout } from '../layouts/WorkerLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Public Pages
import { HomePage } from '../pages/public/HomePage';
import { MarketplacePage } from '../pages/public/MarketplacePage';
import { ProductDetailPage } from '../pages/public/ProductDetailPage';
import { FarmersPage } from '../pages/public/FarmersPage';
import { FarmerProfilePage } from '../pages/public/FarmerProfilePage';
import { WorkersPage } from '../pages/public/WorkersPage';
import { JobsPage } from '../pages/public/JobsPage';
import { MarketPricesPage } from '../pages/public/MarketPricesPage';
import { WeatherPage } from '../pages/public/WeatherPage';
import { ArticlesPage } from '../pages/public/ArticlesPage';
import { ArticleDetailPage } from '../pages/public/ArticleDetailPage';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';

// Farmer Pages
import { FarmerDashboard } from '../pages/farmer/FarmerDashboard';
import { FarmerProducts } from '../pages/farmer/FarmerProducts';
import { FarmerAddProduct } from '../pages/farmer/FarmerAddProduct';
import { FarmerOrders } from '../pages/farmer/FarmerOrders';
import { FarmerJobs } from '../pages/farmer/FarmerJobs';
import { FarmerAIChat } from '../pages/farmer/FarmerAIChat';

// Consumer Pages
import { ConsumerDashboard } from '../pages/consumer/ConsumerDashboard';
import { ConsumerCart } from '../pages/consumer/ConsumerCart';
import { ConsumerOrders } from '../pages/consumer/ConsumerOrders';
import { ConsumerAIChat } from '../pages/consumer/ConsumerAIChat';

// Worker Pages
import { WorkerDashboard } from '../pages/worker/WorkerDashboard';
import { WorkerApplications } from '../pages/worker/WorkerApplications';

// Admin Pages
import { AdminOverview } from '../pages/admin/AdminOverview';
import { AdminVerification } from '../pages/admin/AdminVerification';
import { AdminProducts } from '../pages/admin/AdminProducts';
import { AdminOrders } from '../pages/admin/AdminOrders';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/farmers" element={<FarmersPage />} />
        <Route path="/farmer/:id" element={<FarmerProfilePage />} />
        <Route path="/workers" element={<WorkersPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/market-prices" element={<MarketPricesPage />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/articles/:slug" element={<ArticleDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Farmer Portal */}
        <Route
          path="/farmer"
          element={
            <ProtectedRoute allowedRoles={['farmer', 'admin']}>
              <FarmerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/farmer/dashboard" replace />} />
          <Route path="dashboard" element={<FarmerDashboard />} />
          <Route path="products" element={<FarmerProducts />} />
          <Route path="products/new" element={<FarmerAddProduct />} />
          <Route path="orders" element={<FarmerOrders />} />
          <Route path="workers" element={<WorkersPage />} />
          <Route path="jobs" element={<FarmerJobs />} />
          <Route path="market-prices" element={<MarketPricesPage />} />
          <Route path="weather" element={<WeatherPage />} />
          <Route path="ai" element={<FarmerAIChat />} />
          <Route path="profile" element={<FarmerProfilePage />} />
        </Route>

        {/* Consumer Portal */}
        <Route
          path="/consumer"
          element={
            <ProtectedRoute allowedRoles={['consumer', 'admin']}>
              <ConsumerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/consumer/dashboard" replace />} />
          <Route path="dashboard" element={<ConsumerDashboard />} />
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="cart" element={<ConsumerCart />} />
          <Route path="orders" element={<ConsumerOrders />} />
          <Route path="favorites" element={<FarmersPage />} />
          <Route path="farmers" element={<FarmersPage />} />
          <Route path="market-prices" element={<MarketPricesPage />} />
          <Route path="weather" element={<WeatherPage />} />
          <Route path="ai" element={<ConsumerAIChat />} />
          <Route path="profile" element={<ConsumerDashboard />} />
        </Route>

        {/* Worker Portal */}
        <Route
          path="/worker"
          element={
            <ProtectedRoute allowedRoles={['worker', 'admin']}>
              <WorkerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/worker/dashboard" replace />} />
          <Route path="dashboard" element={<WorkerDashboard />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="applications" element={<WorkerApplications />} />
          <Route path="earnings" element={<WorkerDashboard />} />
          <Route path="profile" element={<WorkerDashboard />} />
        </Route>

        {/* Admin Portal */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="verification" element={<AdminVerification />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminOverview />} />
          <Route path="market-prices" element={<MarketPricesPage />} />
          <Route path="articles" element={<ArticlesPage />} />
          <Route path="reports" element={<AdminOverview />} />
          <Route path="settings" element={<AdminOverview />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
