import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import LogUploadPage from './pages/LogUploadPage';
import LogAnalysisPage from './pages/LogAnalysisPage';
import SecurityAlertsPage from './pages/SecurityAlertsPage';
import FSMVisualizationPage from './pages/FSMVisualizationPage';
import api from './services/api';

export default function App() {
  const [alertCount, setAlertCount] = useState(0);
  const [dbConnected, setDbConnected] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    async function fetchGlobalStatus() {
      try {
        const statsRes = await api.getDashboardStats();
        if (statsRes.success) {
          setAlertCount(statsRes.data?.totalAlerts || 0);
          setDbConnected(Boolean(statsRes.dbStatus?.connected));
        }
      } catch (err) {
        console.warn('Could not fetch initial stats:', err.message);
      }
    }
    fetchGlobalStatus();
  }, [refreshTrigger]);

  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar alertCount={alertCount} dbConnected={dbConnected} />
        <Routes>
          <Route
            path="/"
            element={
              <DashboardPage
                refreshTrigger={refreshTrigger}
                triggerRefresh={triggerRefresh}
              />
            }
          />
          <Route
            path="/upload"
            element={<LogUploadPage triggerRefresh={triggerRefresh} />}
          />
          <Route
            path="/logs"
            element={<LogAnalysisPage refreshTrigger={refreshTrigger} />}
          />
          <Route
            path="/alerts"
            element={<SecurityAlertsPage refreshTrigger={refreshTrigger} />}
          />
          <Route
            path="/fsm"
            element={<FSMVisualizationPage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
