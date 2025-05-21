import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

// Lazy loading pages for better performance
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

// For testing purposes, we'll use a simple component for pages that don't exist yet
const PlaceholderPage = ({ title }) => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p>This page is under construction.</p>
  </div>
);

// Lazy load admin pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));

// Lazy load settings pages
const AmazonCredentialsPage = lazy(() => import('./pages/settings/AmazonCredentialsPage'));
const CreateStorePage = lazy(() => import('./pages/stores/CreateStorePage'));
const StoresPage = lazy(() => import('./pages/stores/StoresPage'));
const StoreSettingsPage = lazy(() => import('./pages/stores/StoreSettingsPage'));
const StoreUsersPage = lazy(() => import('./pages/stores/StoreUsersPage'));

// Lazy load product pages
const ProductsPage = lazy(() => import('./pages/stores/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/stores/ProductDetailPage'));
const NewProductPage = lazy(() => import('./pages/stores/NewProductPage'));

// Use placeholder components for now
const DashboardPage = () => <PlaceholderPage title="Dashboard" />;
const StoreDetailPage = () => <PlaceholderPage title="Store Details" />;
const OrdersPage = () => <PlaceholderPage title="Orders" />;

// Admin placeholder pages
const AdminStoresPage = () => <PlaceholderPage title="Admin - Stores Management" />;
const AdminUsersPage = () => <PlaceholderPage title="Admin - Users Management" />;
const AdminSubscriptionsPage = () => <PlaceholderPage title="Admin - Subscriptions Management" />;

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<AuthLayout />}>
              <Route index element={<Navigate to="/auth/login" replace />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="stores" element={<AdminStoresPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            </Route>

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              
              {/* Store pages */}
              <Route path="stores">
                <Route index element={<StoresPage />} />
                <Route path="new" element={<CreateStorePage />} />
                <Route path=":storeId" element={<StoreDetailPage />} />
                <Route path=":storeId/settings" element={<StoreSettingsPage />} />
                <Route path=":storeId/users" element={<StoreUsersPage />} />
                <Route path=":storeId/amazon-credentials" element={<AmazonCredentialsPage />} />
                
                {/* Product pages */}
                <Route path=":storeId/products">
                  <Route index element={<ProductsPage />} />
                  <Route path="new" element={<NewProductPage />} />
                  <Route path=":productId" element={<ProductDetailPage />} />
                </Route>
                
                {/* Order pages */}
                <Route path=":storeId/orders">
                  <Route index element={<OrdersPage />} />
                </Route>
              </Route>
              
              {/* Legacy routes - redirect to store-specific routes */}
              <Route path="products" element={<Navigate to="/stores" replace />} />
              <Route path="orders" element={<Navigate to="/stores" replace />} />
            </Route>

            {/* 404 page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;
