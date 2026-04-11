import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";

const COMPANIES = ["Google", "Amazon", "Microsoft", "LeetCode"];
const DURATIONS = [15, 30, 45, 60];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

function InterviewSetupPage() {
  const navigate = useNavigate();
  const { settings, saveSettings, startInterview, user } = useAppState();

  const [form, setForm] = useState(settings);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleStart = (event) => {
    event.preventDefault();
    saveSettings(form);
    startInterview();
    navigate("/interview/session");
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <p className="dashboard-sidebar-label">Menu</p>
        <nav className="dashboard-sidebar-nav">
          <NavLink to="/interview/setup" className={({ isActive }) => `dashboard-sidebar-link ${isActive ? "dashboard-sidebar-link--active" : ""}`}>
            Dashboard
          </NavLink>
          <NavLink to="/interviews/old" className={({ isActive }) => `dashboard-sidebar-link ${isActive ? "dashboard-sidebar-link--active" : ""}`}>
            Completed Interviews
          </NavLink>
        </nav>
      </aside>

      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-greeting">{greeting}, {user?.name ?? "there"}</h1>
            <p className="dashboard-subheading">Configure your session below and start when ready.</p>
          </div>
        </div>

        <form onSubmit={handleStart} className="dashboard-form">
          <div className="dashboard-section">
            <h3 className="dashboard-section-title">Session Name</h3>
            <input
              className="dashboard-name-input"
              value={form.interviewName}
              onChange={(e) => update("interviewName", e.target.value)}
              placeholder="e.g. Frontend Interview Prep"
            />
          </div>

          <div className="dashboard-section">
            <h3 className="dashboard-section-title">Company</h3>
            <div className="dashboard-tiles">
              {COMPANIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`dashboard-tile ${form.company === c ? "dashboard-tile--active" : ""}`}
                  onClick={() => update("company", c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {form.company === "LeetCode" && (
            <div className="dashboard-section">
              <h3 className="dashboard-section-title">Difficulty</h3>
              <div className="dashboard-tiles">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`dashboard-tile dashboard-tile--difficulty dashboard-tile--${d.toLowerCase()} ${form.difficulty === d ? "dashboard-tile--active" : ""}`}
                    onClick={() => update("difficulty", d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="dashboard-section">
            <h3 className="dashboard-section-title">Duration</h3>
            <div className="dashboard-tiles">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`dashboard-tile ${form.durationMinutes === d ? "dashboard-tile--active" : ""}`}
                  onClick={() => update("durationMinutes", d)}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>

          <div className="dashboard-start-row">
            <button type="submit" className="dashboard-start-btn">
              Begin Session
            </button>
            <span className="dashboard-start-meta">
              {form.company}{form.company === "LeetCode" ? ` · ${form.difficulty}` : ""} · {form.durationMinutes} min
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InterviewSetupPage;
