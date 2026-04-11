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

// Python syntax highlighter
function highlightPython(code) {
  const pythonKeywords = /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|assert|break|continue|del|global|nonlocal|pass|raise|and|or|not|in|is|True|False|None)\b/g;
  const pythonBuiltins = /\b(print|len|range|str|int|float|list|dict|set|tuple|sum|max|min|enumerate|zip|map|filter|sorted|reversed|open|input|type|isinstance|hasattr|getattr|setattr|callable)\b/g;
  const strings = /(['"`])(?:(?=(\\?))\2.)*?\1/g;
  const comments = /#.*$/gm;
  const numbers = /\b\d+\.?\d*\b/g;

  let highlighted = code;
  let offset = 0;

  // Store all matches with their positions and types
  const matches = [];

  // Comments
  code.replace(comments, (match, index) => {
    matches.push({ start: code.indexOf(match, offset), end: code.indexOf(match, offset) + match.length, type: "comment", text: match });
    offset = code.indexOf(match, offset) + match.length;
    return match;
  });

  // Strings
  offset = 0;
  code.replace(strings, (match, index) => {
    matches.push({ start: code.indexOf(match, offset), end: code.indexOf(match, offset) + match.length, type: "string", text: match });
    offset = code.indexOf(match, offset) + match.length;
    return match;
  });

  // Keywords
  offset = 0;
  code.replace(pythonKeywords, (match, index) => {
    const start = code.indexOf(match, offset);
    matches.push({ start, end: start + match.length, type: "keyword", text: match });
    offset = start + match.length;
    return match;
  });

  // Builtins
  offset = 0;
  code.replace(pythonBuiltins, (match, index) => {
    const start = code.indexOf(match, offset);
    matches.push({ start, end: start + match.length, type: "builtin", text: match });
    offset = start + match.length;
    return match;
  });

  // Numbers
  offset = 0;
  code.replace(numbers, (match, index) => {
    const start = code.indexOf(match, offset);
    matches.push({ start, end: start + match.length, type: "number", text: match });
    offset = start + match.length;
    return match;
  });

  return matches;
}

// Component to render highlighted code
function CodeHighlighter({ code }) {
  const matches = highlightPython(code);
  const colorMap = {
    keyword: "#569cd6",  // Blue
    string: "#ce9178",   // Orange/brown
    comment: "#6a9955",  // Green
    builtin: "#4fc1ff",  // Light blue
    number: "#b5cea8",   // Light green
  };

  const lines = code.split("\n");

  return (
    <div style={{ display: "flex", lineHeight: "1.6" }}>
      <div
        style={{
          color: "#858585",
          paddingRight: "1.5rem",
          textAlign: "right",
          userSelect: "none",
          minWidth: "fit-content",
        }}
      >
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <pre
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          flex: 1,
          color: "#d4d4d4",
          fontFamily: "monospace",
        }}
      >
        {lines.map((line, lineNum) => (
          <div key={lineNum}>
            {line.split("").map((char, charIdx) => {
              let displayColor = "#d4d4d4";

              for (const match of matches) {
                const lineStart = code.substring(0, code.lastIndexOf("\n", code.indexOf(line))).split("\n").reduce((a, b, i) => a + b.length + 1, 0);
                const charPos = lineStart + charIdx;

                if (charPos >= match.start && charPos < match.end) {
                  displayColor = colorMap[match.type];
                  break;
                }
              }

              return (
                <span key={charIdx} style={{ color: displayColor }}>
                  {char}
                </span>
              );
            })}
          </div>
        ))}
      </pre>
    </div>
  );
}

function OldInterviewsPage() {
  const navigate = useNavigate();
  const { user } = useAppState();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentType, setContentType] = useState(null); // 'transcript' or 'code'

  useEffect(() => {
    if (!user?.id) {
      setError("Please log in to view previous interviews.");
      setLoading(false);
      return;
    }

    const fetchInterviews = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/interviews/user/${user.id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch interviews");
        }

        const data = await response.json();
        setInterviews(data);
      } catch (err) {
        setError(
          "Could not load previous interviews. Make sure the server is running."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [user?.id]);

  const handleDelete = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this interview?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/interviews/${sessionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete interview");
      }

      // Remove from local state
      setInterviews(interviews.filter((i) => i._id !== sessionId));
    } catch (err) {
      alert("Failed to delete interview");
    }
  };

  const handleViewContent = (content, type) => {
    setSelectedContent(content);
    setContentType(type);
  };

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
          <p>No interviews yet. Complete an interview session to see it here!</p>
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
              <p style={{ fontSize: "0.9em", opacity: 0.7 }}>
                Time left: {formatTime(interview.timeLeftSeconds)}
              </p>
            )}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              {interview.transcript && (
                <button
                  type="button"
                  onClick={() =>
                    handleViewContent(interview.transcript, "transcript")
                  }
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
                  onClick={() => handleViewContent(interview.code, "code")}
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
              <button
                type="button"
                onClick={() => handleDelete(interview._id)}
                style={{
                  padding: "0.6rem 1rem",
                  fontSize: "0.9rem",
                  backgroundColor: "#dc3545",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.4rem",
                  cursor: "pointer",
                  marginLeft: "auto",
                }}
              >
                Delete
              </button>
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

      {/* Content Modal (Transcript/Code) */}
      {selectedContent && (
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
          onClick={() => setSelectedContent(null)}
        >
          <div
            style={{
              backgroundColor: "var(--color-bg, #fff)",
              color: "var(--color-text, #000)",
              borderRadius: "0.8rem",
              maxWidth: "700px",
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
              <h2 style={{ margin: 0 }}>
                {contentType === "code" ? "Code" : "Transcript"}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedContent(null)}
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

            {contentType === "code" ? (
              // Code view with syntax highlighting
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  overflowX: "auto",
                  padding: "1.5rem",
                  backgroundColor: "#1e1e1e",
                  color: "#d4d4d4",
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                }}
              >
                <CodeHighlighter code={selectedContent} />
              </div>
            ) : (
              // Transcript view
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
                {selectedContent}
              </div>
            )}

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
                onClick={() => setSelectedContent(null)}
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
