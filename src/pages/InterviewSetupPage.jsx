import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";

function InterviewSetupPage() {
  const navigate = useNavigate();
  const { settings, saveSettings, startInterview } = useAppState();

  const [form, setForm] = useState(settings);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleStart = (event) => {
    event.preventDefault();
    saveSettings({
      ...form,
      durationMinutes: Number(form.durationMinutes),
    });
    startInterview();
    navigate("/interview/session");
  };

  return (
    <section className="page narrow">
      <div className="card">
        <h1>Interview Setup</h1>
        <form onSubmit={handleStart} className="stack">
          <label htmlFor="role">Role</label>
          <input
            id="role"
            value={form.role}
            onChange={(event) => updateForm("role", event.target.value)}
          />

          <label htmlFor="difficulty">Difficulty</label>
          <select
            id="difficulty"
            value={form.difficulty}
            onChange={(event) => updateForm("difficulty", event.target.value)}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>

          <label htmlFor="duration">Duration (minutes)</label>
          <select
            id="duration"
            value={form.durationMinutes}
            onChange={(event) =>
              updateForm("durationMinutes", event.target.value)
            }
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
          </select>

          <button type="submit">Begin Session</button>
        </form>
      </div>
    </section>
  );
}

export default InterviewSetupPage;
