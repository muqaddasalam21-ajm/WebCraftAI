import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/Login';
import { SignupPage } from './pages/Signup';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardPage } from './pages/Dashboard';
import { ProductsPage } from './pages/Products';
import { OrdersPage } from './pages/Orders';
import { OrderWebsitePage } from './pages/Orders/OrderWebsitePage';
import { OrderDetailsPage } from './pages/Orders/OrderDetailsPage';
import { ReportsPage } from './pages/Reports';
import { BusinessDashboardPage } from './pages/Dashboard/BusinessDashboardPage';
import { UsersPage } from './pages/Users';
import { VendorsPage } from './pages/Vendors';
import { TemplatesPage } from './pages/Templates';
import { TemplateDetailsPage } from './pages/Templates/TemplateDetailsPage';
import { TemplateFormPage } from './pages/Templates/TemplateFormPage';
import { MyTemplatesPage } from './pages/Templates/MyTemplatesPage';
import { TemplateLivePreviewPage } from './pages/Templates/TemplateLivePreviewPage';
import { AIAgentPage } from './pages/AIAgent';
import { ProfilePage } from './pages/Profile';
import ServicePackagesPage from './pages/ServicePackages';
import ServicePackageFormPage from './pages/ServicePackages/ServicePackageFormPage';
import { ProjectsPage } from './pages/Projects';
import { MyProjectsPage } from './pages/Projects/MyProjectsPage';
import { ProjectDetailsPage } from './pages/Projects/ProjectDetailsPage';
import { AIBuilderPage } from './pages/AIBuilder';
import { AIWebsitePreviewPage } from './pages/AIBuilder/PreviewPage';
import { CheckoutPage } from './pages/Checkout';
import { CheckoutSuccessPage } from './pages/Checkout/SuccessPage';
import { CheckoutFailedPage } from './pages/Checkout/FailedPage';
import { NotificationsPage } from './pages/Notifications';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Authentication */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/templates/:id/preview" element={<TemplateLivePreviewPage />} />

          {/* Dedicated Protected Checkout Routes */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/success"
            element={
              <ProtectedRoute>
                <CheckoutSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/failed"
            element={
              <ProtectedRoute>
                <CheckoutFailedPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Dashboard Application Shell */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            
            {/* Admin Only: Users & Vendors */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="vendors"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <VendorsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin, Manager, Vendor: Products & Reports */}
            <Route
              path="products"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Vendor']}>
                  <ProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Vendor']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            {/* Phase 15: Real Business Dashboard & Advanced Reports */}
            <Route path="business" element={<BusinessDashboardPage />} />

            {/* Admin, Manager: Service Packages Management */}
            <Route
              path="service-packages"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                  <ServicePackagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="service-packages/new"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                  <ServicePackageFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="service-packages/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                  <ServicePackageFormPage />
                </ProtectedRoute>
              }
            />

            {/* Admin, Manager: Website Projects Management */}
            <Route
              path="projects"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                  <ProjectsPage />
                </ProtectedRoute>
              }
            />

            {/* Accessible to all authenticated users */}
            <Route path="my-projects" element={<MyProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/new-website" element={<OrderWebsitePage />} />
            <Route path="orders/:id" element={<OrderDetailsPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="templates/new" element={<TemplateFormPage />} />
            <Route path="templates/:id" element={<TemplateDetailsPage />} />
            <Route path="templates/:id/preview" element={<TemplateLivePreviewPage />} />
            <Route path="templates/:id/edit" element={<TemplateFormPage />} />
            <Route path="my-templates" element={<MyTemplatesPage />} />
            <Route path="ai-builder" element={<AIBuilderPage />} />
            <Route path="ai-builder/:id/preview" element={<AIWebsitePreviewPage />} />
            <Route path="ai-agent" element={<AIAgentPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
