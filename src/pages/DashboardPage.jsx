import { useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAppState();

  return (
    <section className="page">
      <div className="card">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name}.</p>
        <p>Ready to practice your technical interview flow?</p>
        <button type="button" onClick={() => navigate("/interview/setup")}>
          Start Interview
        </button>
      </div>
    </section>
  );
}

export default DashboardPage;
