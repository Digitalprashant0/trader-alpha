import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TradeLog } from './pages/TradeLog';
import { AddTrade } from './pages/AddTrade';
import { Portfolio } from './pages/Portfolio';
import { Analytics } from './pages/Analytics';
import { Funds } from './pages/Funds';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/trades" element={<Layout><TradeLog /></Layout>} />
          <Route path="/add-trade" element={<Layout><AddTrade /></Layout>} />
          <Route path="/portfolio" element={<Layout><Portfolio /></Layout>} />
          <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
          <Route path="/funds" element={<Layout><Funds /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
