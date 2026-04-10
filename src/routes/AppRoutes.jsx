import { Navigate, Route, Routes } from "react-router-dom";
import InterviewSessionPage from "../pages/InterviewSessionPage";
import InterviewSetupPage from "../pages/InterviewSetupPage";
import LoginPage from "../pages/LoginPage";
import OldInterviewsPage from "../pages/OldInterviewsPage";
import ResultsPage from "../pages/ResultsPage";
import { useAppState } from "../lib/AppStateContext";

function ProtectedRoute({ children }) {
  const { user, authLoading } = useAppState();

  if (authLoading) {
    return (
      <section className="page narrow">
        <div className="card">
          <p>Checking your session...</p>
        </div>
      </section>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, authLoading } = useAppState();

  if (authLoading) {
    return (
      <section className="page narrow">
        <div className="card">
          <p>Loading...</p>
        </div>
      </section>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={user ? "/interview/setup" : "/login"} replace />}
      />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/interview/setup"
        element={
          <ProtectedRoute>
            <InterviewSetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview/session"
        element={
          <ProtectedRoute>
            <InterviewSessionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <ResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviews/old"
        element={
          <ProtectedRoute>
            <OldInterviewsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
