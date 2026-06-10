import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Dashboard from './components/dashboard';
import AlarmListesi from './components/AlarmListesi';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Devices from './components/Devices';
import Alarms from './components/Alarms';
import Analysis from './components/Analysis';

// Protected Route bileşeni: Kullanıcı giriş yapmamışsa Login sayfasına atar
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('userToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Ana Dashboard düzeni
const DashboardLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

// Yalnızca Dashboard sayfası için (Dashboard + AlarmListesi)
const DashboardPage = () => {
  return (
    <>
      <Dashboard />
      <AlarmListesi />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          } 
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="devices" element={<Devices />} />
          <Route path="alarms" element={<Alarms />} />
          <Route path="analysis" element={<Analysis />} />
        </Route>

        {/* Bilinmeyen rotaları varsayılan olarak dashboard'a yönlendir */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;