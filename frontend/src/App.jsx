import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import AdminLogin from './pages/AdminLogin';
import CandidateLogin from './pages/CandidateLogin';
import CandidateDashboard from './pages/CandidateDashboard';
import AvailableAssessments from './pages/AvailableAssessments';
import TakeAssessment from './pages/TakeAssessment';
import McqInterview from './pages/McqInterview';
import ConfirmSubmit from './pages/ConfirmSubmit';
import AssessmentResults from './pages/AssessmentResults';
import AdminDashboard from './pages/AdminDashboard';
import CategoryManagement from './pages/CategoryManagement';
import AssessmentManagement from './pages/AssessmentManagement';
import QuestionManagement from './pages/QuestionManagement';
import CandidateManagement from './pages/CandidateManagement';
import ModuleManagement from './pages/ModuleManagement';
import ResultsManagement from './pages/ResultsManagement';

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

const CandidateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/candidate/login" replace />;
  }

  return children;
};

const HomeRoute = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/candidate/dashboard" replace />;
  }

  return <CandidateLogin />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Home / Direct Entry */}
          <Route path="/" element={<HomeRoute />} />

          {/* Candidate Experience */}
          <Route path="/candidate/login" element={<CandidateLogin />} />
          <Route path="/candidate/dashboard" element={<CandidateRoute><CandidateDashboard /></CandidateRoute>} />
          <Route path="/login" element={<Navigate to="/candidate/login" replace />} />

          {/* Assessments & Interview */}
          <Route path="/take-test" element={<TakeAssessment />} />
          <Route path="/take-test/:assessmentId" element={<TakeAssessment />} />
          <Route path="/assessment/:assessmentId" element={<TakeAssessment />} />
          <Route path="/assessments" element={<AvailableAssessments />} />
          <Route path="/interview/:attemptId" element={<McqInterview />} />
          <Route path="/assessment/:attemptId/confirm-submit" element={<ConfirmSubmit />} />
          <Route path="/results/:attemptId" element={<AssessmentResults />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginRoute><AdminLogin /></AdminLoginRoute>} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/categories" element={<AdminRoute><CategoryManagement /></AdminRoute>} />
          <Route path="/admin/assessments" element={<AdminRoute><AssessmentManagement /></AdminRoute>} />
          <Route path="/admin/assessments/:assessmentId/questions" element={<AdminRoute><QuestionManagement /></AdminRoute>} />
          <Route path="/admin/candidates" element={<AdminRoute><CandidateManagement /></AdminRoute>} />
          <Route path="/admin/modules" element={<AdminRoute><ModuleManagement /></AdminRoute>} />
          <Route path="/admin/results" element={<AdminRoute><ResultsManagement /></AdminRoute>} />
          <Route path="/admin/results/:attemptId" element={<AdminRoute><AssessmentResults isAdminView={true} /></AdminRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
