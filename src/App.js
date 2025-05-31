// src/App.js - Updated with invoice routes
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { ConfigProvider, Spin, App } from 'antd';
import 'antd/dist/reset.css';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import { onAuthStateChanged } from 'firebase/auth';

import { store } from './app/store';
import { auth } from './firebase/config';
import { setUser, setLoading } from './features/auth/authSlice';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Dashboard from './components/dashboard/Dashboard';
import ProductList from './components/products/ProductList';
import CustomerList from './components/customer/CustomerList';
import OrderList from './components/billing/OrderList';
import ExpenseList from './components/expense/ExpenseList';
import Billing from './components/billing/Billing';
import Reports from './components/reports/Reports';
import Invoice from './components/billing/Invoice';
import InvoiceList from './components/billing/InvoiceList';

const antdTheme = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 8,
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    Card: {
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    Button: {
      borderRadius: 8,
    },
  },
};

// Auth listener component
function AuthListener() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setLoading(true));
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }));
      } else {
        dispatch(setUser(null));
      }
      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch]);

  return null;
}

// Protected Route component
function ProtectedRoute({ children }) {
  const { user, loading } = useSelector(state => state.auth);
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}

export default function AppWrapper() {
  return (
    <Provider store={store}>
      <ConfigProvider theme={antdTheme}>
        <Router>
          <AuthListener />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/products" element={<ProductList />} />
                      <Route path="/customers" element={<CustomerList />} />
                      <Route path="/orders" element={<OrderList />} />
                      <Route path="/expenses" element={<ExpenseList />} />
                      <Route path="/billing" element={<Billing />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/invoices" element={<InvoiceList />} />
                      <Route path="/invoices/:id" element={<Invoice />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </ConfigProvider>
    </Provider>
  );
}