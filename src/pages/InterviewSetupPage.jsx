import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";

const COMPANIES = ["Google", "Amazon", "Microsoft", "LeetCode"];
const DURATIONS = [15, 30, 45, 60];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const QUESTION_TYPES = ["Coding", "Theory"];

function InterviewSetupPage() {
  const navigate = useNavigate();
  const { settings, saveSettings, startInterview, user } = useAppState();

  const [form, setForm] = useState(settings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const handleStart = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.interviewName.trim()) {
      setError("Please enter a session name");
      return;
    }

    setLoading(true);
    saveSettings(form);
    await startInterview(form);
    navigate("/interview/session");
  };

  const hour = new Date().getHours();
  const greetingBase =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const fullGreeting = `${greetingBase}, ${user?.name ?? "there"}`;

  const [typedGreeting, setTypedGreeting] = useState("");
  const [greetingDone, setGreetingDone] = useState(false);

  useEffect(() => {
    setTypedGreeting("");
    setGreetingDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedGreeting(fullGreeting.slice(0, i));
      if (i >= fullGreeting.length) {
        clearInterval(interval);
        setGreetingDone(true);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [fullGreeting]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-greeting">
            {typedGreeting}
            <span
              className={`greeting-cursor greeting-cursor--${greetingDone ? "done" : "typing"}`}
            >
              ▋
            </span>
          </h1>
          <p className="dashboard-subheading">
            Configure your session below and start when ready.
          </p>
        </div>
      </div>

      <form onSubmit={handleStart} className="dashboard-form">
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">Session Name</h3>
          <input
            className="dashboard-name-input"
            value={form.interviewName}
            onChange={(e) => update("interviewName", e.target.value)}
            placeholder="e.g. Google Interview Prep"
          />
          {error && (
            <p
              style={{
                color: "var(--error)",
                fontSize: "0.875rem",
                marginTop: "0.5rem",
                margin: "0.5rem 0 0 0",
              }}
            >
              {error}
            </p>
          )}
        </div>

        <div className="dashboard-section">
          <h3 className="dashboard-section-title">Question Type</h3>
          <div className="dashboard-tiles">
            {QUESTION_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={`dashboard-tile ${form.questionType === t ? "dashboard-tile--active" : ""}`}
                onClick={() => update("questionType", t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {form.questionType === "Coding" && (
          <>
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
          </>
        )}

        {form.questionType === "Theory" && (
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
          <button
            type="submit"
            className="dashboard-start-btn"
            disabled={loading}
          >
            {loading ? "Loading..." : "Begin Session"}
          </button>
          <span className="dashboard-start-meta">
            {form.questionType}
            {form.questionType === "Coding" &&
              ` · ${form.company}${form.company === "LeetCode" ? ` · ${form.difficulty}` : ""}`}
            {form.questionType === "Theory" && ` · ${form.difficulty}`}
            {" · "}
            {form.durationMinutes} min
          </span>
        </div>
      </form>
    </div>
  );
}

export default InterviewSetupPage;
