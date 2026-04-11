import { useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useAppState } from "./lib/AppStateContext";
import AppRoutes from "./routes/AppRoutes";
import "./App.css";

function App() {
  const location = useLocation();
  const { user } = useAppState();
  const hideNavbar = location.pathname === "/login" && !user;
  const isInterviewSession = location.pathname === "/interview/session";
  const isLogin = location.pathname === "/login" && !user;

  return (
    <div className="app-shell">
      {!hideNavbar && <Navbar />}
      <div
        className={`app-scroll ${isInterviewSession ? "app-scroll--session" : ""} ${isLogin ? "app-scroll--login" : ""}`}
      >
        <main className={`app-main ${isInterviewSession ? "app-main--session" : ""} ${isLogin ? "app-main--login" : ""}`}>
          <AppRoutes />
        </main>
      </div>
    </div>
  );
}

export default App;
