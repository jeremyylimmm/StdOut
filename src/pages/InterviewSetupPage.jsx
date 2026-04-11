import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";

const popularCompanies = ["Google", "Amazon", "Microsoft", "LeetCode"];

function InterviewSetupPage() {
  const navigate = useNavigate();
  const { settings, saveSettings, startInterview } = useAppState();

  const [form, setForm] = useState(settings);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleStart = (event) => {
    event.preventDefault();
    saveSettings(form);
    startInterview();
    navigate("/interview/session");
  };

  return (
    <section className="page narrow">
      <div className="card">
        <h1>Interview Setup</h1>
        <form onSubmit={handleStart} className="stack">
          <label htmlFor="interviewName">Name of interview</label>
          <input
            id="interviewName"
            value={form.interviewName}
            onChange={(event) =>
              updateForm("interviewName", event.target.value)
            }
            placeholder="Frontend Interview Prep"
          />

          <label htmlFor="company">Company</label>
          <select
            id="company"
            value={form.company}
            onChange={(event) => updateForm("company", event.target.value)}
          >
            {popularCompanies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>

          {form.company === "LeetCode" && (
            <>
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                value={form.difficulty}
                onChange={(event) =>
                  updateForm("difficulty", event.target.value)
                }
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </>
          )}

          <button type="submit">Begin Session</button>
        </form>
      </div>
    </section>
  );
}

export default InterviewSetupPage;
