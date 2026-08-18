import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ProjectPage } from './pages/ProjectPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { RoadmapPage } from './pages/RoadmapPage';
import { PresentationsPage } from './pages/PresentationsPage';
import { PlanningPresentationPage } from './pages/PlanningPresentationPage';
import { DashboardPage } from './pages/DashboardPage';
import { TeamPage } from './pages/TeamPage';
import { AdminPage } from './pages/AdminPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 bg-tech-grid relative">
          <div className="absolute inset-0 bg-radial-gradient pointer-events-none" />
          <Navbar />
          <main className="flex-grow z-10">
            <Routes>
              {/* Public Website Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/project" element={<ProjectPage />} />
              <Route path="/architecture" element={<ArchitecturePage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/presentations" element={<PresentationsPage />} />
              <Route path="/presentations/planning/v1" element={<PlanningPresentationPage />} />
              <Route path="/presentations/:slug/:versionTag" element={<PlanningPresentationPage />} />
              <Route path="/presentation/:versionTag" element={<PlanningPresentationPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/team" element={<TeamPage />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/login" element={<AdminPage />} />
              <Route path="/admin/dashboard" element={<AdminPage />} />
              <Route path="/admin/upload" element={<AdminPage />} />
              <Route path="/admin/presentations" element={<AdminPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
