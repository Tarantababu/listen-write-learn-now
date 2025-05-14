
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Layout from './components/Layout';
import RoadmapPage from './pages/RoadmapPage';
import { UserSettingsProvider } from './contexts/UserSettingsContext';

function App() {
  return (
    <UserSettingsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/roadmap" element={
            <Layout>
              <RoadmapPage />
            </Layout>
          } />
        </Routes>
      </Router>
    </UserSettingsProvider>
  );
}

export default App;
