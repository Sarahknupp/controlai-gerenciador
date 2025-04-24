import React from 'react';
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CashierProvider } from './contexts/CashierContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { StripeProvider } from './context/StripeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import DebtManagement from './pages/DebtManagement/index';
import CashFlow from './pages/CashFlow';
import Employees from './pages/Employees';
import Inventory from './pages/Inventory';
import InventoryVerification from './pages/InventoryVerification';
import UnifiedInventory from './pages/UnifiedInventory';
import POS from './pages/POS';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import Production from './pages/Production';
import AccountantPanel from './pages/AccountantPanel';
import Sales from './pages/Sales/Sales';
import CustomerManagement from './pages/Sales/CustomerManagement';
import ProductManagement from './pages/Sales/ProductManagement';
import InventoryManagement from './pages/Sales/InventoryManagement';
import FiscalDocumentation from './pages/Sales/FiscalDocumentation';
import Checkout from './pages/Sales/Checkout';
import PaymentDemo from './pages/PaymentDemo';
import ModernCheckout from './pages/Sales/ModernCheckout';
import PDVModern from './pages/Sales/PDVModern';
import DocumentImporter from './pages/Sales/DocumentImporter';
import OcrProcessor from './pages/Sales/OcrProcessor';
import SalesAnalytics from './pages/Sales/SalesAnalytics';
import IntegrationDashboard from './pages/Sales/IntegrationDashboard';
import AutomationHub from './pages/Sales/AutomationHub';
import PaymentsHome from './pages/Payments/index';
import PaymentCheckout from './pages/Payments/Checkout';
import PaymentSuccess from './pages/Payments/Success';
import PaymentPlans from './pages/Payments/Plans';
import './index.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserPreferencesProvider>
          <StripeProvider>
            <ToastContainer position="top-right" autoClose={3000} />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <CashierProvider>
                    <Checkout />
                  </CashierProvider>
                </ProtectedRoute>
              } />
              <Route path="/modern-checkout" element={
                <ProtectedRoute>
                  <CashierProvider>
                    <ModernCheckout />
                  </CashierProvider>
                </ProtectedRoute>
              } />
              <Route path="/pdv-modern" element={
                <ProtectedRoute>
                  <CashierProvider>
                    <PDVModern />
                  </CashierProvider>
                </ProtectedRoute>
              } />
              <Route path="/payment-demo" element={
                <ProtectedRoute>
                  <PaymentDemo />
                </ProtectedRoute>
              } />
              <Route path="/payments" element={<PaymentsHome />} />
              <Route path="/plans" element={<PaymentPlans />} />
              <Route path="/checkout/:productId" element={<PaymentCheckout />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <CashierProvider>
                      <Layout />
                    </CashierProvider>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="debts" element={<DebtManagement />} />
                <Route path="cashflow" element={<CashFlow />} />
                <Route path="employees" element={<Employees />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="inventory-verification" element={<InventoryVerification />} />
                <Route path="unified-inventory" element={<UnifiedInventory />} />
                <Route path="pos" element={<POS />} />
                <Route path="reports" element={<Reports />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="production" element={<Production />} />
                <Route path="accountant" element={<AccountantPanel />} />
                <Route path="sales" element={<Sales />} />
                <Route path="sales/customers" element={<CustomerManagement />} />
                <Route path="sales/products" element={<ProductManagement />} />
                <Route path="sales/inventory" element={<InventoryManagement />} />
                <Route path="sales/fiscal" element={<FiscalDocumentation />} />
                <Route path="sales/document-importer" element={<DocumentImporter />} />
                <Route path="sales/ocr-processor" element={<OcrProcessor />} />
                <Route path="sales/analytics" element={<SalesAnalytics />} />
                <Route path="sales/integrations" element={<IntegrationDashboard />} />
                <Route path="sales/automation" element={<AutomationHub />} />
              </Route>
            </Routes>
          </StripeProvider>
        </UserPreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;