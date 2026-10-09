import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import DashboardPage from './pages/DashboardPage';
import WaterBodiesPage from './pages/WaterBodiesPage';
import WaterBodyDetailPage from './pages/WaterBodyDetailPage';
import HotspotsPage from './pages/HotspotsPage';
import MapViewPage from './pages/MapViewPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/water-bodies" element={<WaterBodiesPage />} />
            <Route path="/water-bodies/:id" element={<WaterBodyDetailPage />} />
            <Route path="/hotspots" element={<HotspotsPage />} />
            <Route path="/map" element={<MapViewPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
