import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function OldInterviewsPage() {
  const navigate = useNavigate();
  const { user } = useAppState();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTranscript, setSelectedTranscript] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      setError("Please log in to view previous interviews.");
      setLoading(false);
      return;
    }

    const fetchInterviews = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/interviews/user/${user.id}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch interviews");
        }

        const data = await response.json();
        setInterviews(data);
      } catch (err) {
        setError(
          "Could not load previous interviews. Make sure the server is running.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [user?.id]);

  return (
    <section className="page">
      <div className="card">
        <h1>Previous Interviews</h1>
        <p>Review your past interview sessions and code.</p>
      </div>

      {error && (
        <div className="card" style={{ color: "#ff6b6b" }}>
          {error}
        </div>
      )}

      {loading && <div className="card">Loading interviews...</div>}

      {!loading && !error && interviews.length === 0 && (
        <div className="card">
          <p>
            No interviews yet. Complete an interview session to see it here!
          </p>
        </div>
      )}

      <div className="stack">
        {interviews.map((interview) => (
          <article className="card" key={interview._id}>
            <p>
              <strong>{interview.interview.title}</strong> on{" "}
              {formatDate(interview.completedAt)}
            </p>
            <p>
              {interview.interview.company} · {interview.interview.difficulty} ·{" "}
              {interview.interview.durationMinutes} minutes
            </p>
            {interview.timeLeftSeconds !== undefined && (
              <p style={{ fontSize: "0.9em", color: "var(--color-text, #666)" }}>
                Time left: {formatTime(interview.timeLeftSeconds)}
              </p>
            )}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              {interview.transcript && (
                <button
                  type="button"
                  onClick={() => setSelectedTranscript(interview.transcript)}
                  style={{
                    padding: "0.6rem 1rem",
                    fontSize: "0.9rem",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.4rem",
                    cursor: "pointer",
                  }}
                >
                  View Transcript
                </button>
              )}
              {interview.code && (
                <button
                  type="button"
                  onClick={() => setSelectedTranscript(interview.code)}
                  style={{
                    padding: "0.6rem 1rem",
                    fontSize: "0.9rem",
                    backgroundColor: "#6c757d",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.4rem",
                    cursor: "pointer",
                  }}
                >
                  View Code
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <div>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => navigate("/interview/setup")}
        >
          Back to New Interview
        </button>
      </div>

      {/* Transcript Modal */}
      {selectedTranscript && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setSelectedTranscript(null)}
        >
          <div
            style={{
              backgroundColor: "var(--color-bg, #fff)",
              color: "var(--color-text, #000)",
              borderRadius: "0.8rem",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "1.5rem",
                borderBottom: "1px solid var(--color-border, #e0e0e0)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ margin: 0 }}>Transcript</h2>
              <button
                type="button"
                onClick={() => setSelectedTranscript(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "var(--color-text, #666)",
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1.5rem",
                backgroundColor: "var(--color-input-bg, #fafafa)",
                color: "var(--color-text, #000)",
                fontFamily: "monospace",
                fontSize: "0.9rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {selectedTranscript}
            </div>
            <div
              style={{
                padding: "1rem",
                borderTop: "1px solid var(--color-border, #e0e0e0)",
                textAlign: "right",
                backgroundColor: "var(--color-bg, #fff)",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedTranscript(null)}
                style={{
                  padding: "0.6rem 1.5rem",
                  backgroundColor: "var(--color-primary, #007bff)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.4rem",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default OldInterviewsPage;
