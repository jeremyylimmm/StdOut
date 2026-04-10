import { useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useAppState } from "./lib/AppStateContext";
import AppRoutes from "./routes/AppRoutes";
import "./App.css";

function App() {
  const location = useLocation();
  const { user } = useAppState();
  const hideNavbar = location.pathname === "/login" && !user;

  return (
    <div className="app-shell">
      {!hideNavbar && <Navbar />}
      <main className="app-main">
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
