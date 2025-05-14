
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import RoadmapPage from './pages/RoadmapPage';
import { UserSettingsProvider } from './contexts/UserSettingsContext';
import { RoadmapProvider } from './hooks/use-roadmap';

function App() {
  return (
    <UserSettingsProvider>
      <RoadmapProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={
              <Layout>
                <DashboardPage />
              </Layout>
            } />
            <Route path="/roadmap" element={
              <Layout>
                <RoadmapPage />
              </Layout>
            } />
          </Routes>
        </Router>
      </RoadmapProvider>
    </UserSettingsProvider>
  );
}

export default App;
