import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import AdminLogin from './pages/AdminLogin';
import CandidateLogin from './pages/CandidateLogin';
import AvailableAssessments from './pages/AvailableAssessments';
import TakeAssessment from './pages/TakeAssessment';
import McqInterview from './pages/McqInterview';
import ConfirmSubmit from './pages/ConfirmSubmit';
import AssessmentResults from './pages/AssessmentResults';
import CandidateDashboard from './pages/CandidateDashboard';
import CandidateProfile from './pages/CandidateProfile';
import AdminDashboard from './pages/AdminDashboard';
import CategoryManagement from './pages/CategoryManagement';
import AssessmentManagement from './pages/AssessmentManagement';
import QuestionManagement from './pages/QuestionManagement';
import CandidateManagement from './pages/CandidateManagement';
import ResultsManagement from './pages/ResultsManagement';

// Protected Route for Administrator
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

// Admin Login Route (redirects to admin dashboard if already logged in)
const AdminLoginRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

// Candidate Login Route (redirects to candidate dashboard if already logged in)
const CandidateLoginRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated && user?.role === 'candidate') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ========================================================= */}
          {/* CANDIDATE FLOW (NO LOGIN NEEDED - Direct Name & Email)   */}
          {/* ========================================================= */}
          {/* Primary Assessment Entry Screen (comes first for candidates) */}
          <Route path="/" element={<TakeAssessment />} />
          <Route path="/take-test" element={<TakeAssessment />} />
          <Route path="/take-test/:assessmentId" element={<TakeAssessment />} />
          <Route path="/assessment/:assessmentId" element={<TakeAssessment />} />

          {/* Directory of all available published assessments */}
          <Route path="/assessments" element={<AvailableAssessments />} />

          {/* Live MCQ Assessment Session */}
          <Route path="/interview/:attemptId" element={<McqInterview />} />
          <Route path="/assessment/:attemptId/confirm-submit" element={<ConfirmSubmit />} />

          {/* Assessment Results Breakdown */}
          <Route path="/results/:attemptId" element={<AssessmentResults />} />

          {/* ========================================================= */}
          {/* ADMINISTRATOR FLOW (Strict URL: /admin/login)             */}
          {/* ========================================================= */}
          <Route path="/admin/login" element={<AdminLoginRoute><AdminLogin /></AdminLoginRoute>} />
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />

          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <AdminRoute>
                <CategoryManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/assessments"
            element={
              <AdminRoute>
                <AssessmentManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/assessments/:assessmentId/questions"
            element={
              <AdminRoute>
                <QuestionManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/candidates"
            element={
              <AdminRoute>
                <CandidateManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/results"
            element={
              <AdminRoute>
                <ResultsManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/results/:attemptId"
            element={
              <AdminRoute>
                <AssessmentResults isAdminView={true} />
              </AdminRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/assessments" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
