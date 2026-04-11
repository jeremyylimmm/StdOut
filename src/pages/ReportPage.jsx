import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";
import { FiArrowLeft } from "react-icons/fi";

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

function highlightPython(code) {
  const pythonKeywords =
    /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|assert|break|continue|del|global|nonlocal|pass|raise|and|or|not|in|is|True|False|None)\b/g;
  const pythonBuiltins =
    /\b(print|len|range|str|int|float|list|dict|set|tuple|sum|max|min|enumerate|zip|map|filter|sorted|reversed|open|input|type|isinstance|hasattr|getattr|setattr|callable)\b/g;
  const strings = /(['"`])(?:(?=(\\?))\2.)*?\1/g;
  const comments = /#.*$/gm;
  const numbers = /\b\d+\.?\d*\b/g;

  let offset = 0;
  const matches = [];

  code.replace(comments, (match) => {
    matches.push({ start: code.indexOf(match, offset), end: code.indexOf(match, offset) + match.length, type: "comment", text: match });
    offset = code.indexOf(match, offset) + match.length;
    return match;
  });
  offset = 0;
  code.replace(strings, (match) => {
    matches.push({ start: code.indexOf(match, offset), end: code.indexOf(match, offset) + match.length, type: "string", text: match });
    offset = code.indexOf(match, offset) + match.length;
    return match;
  });
  offset = 0;
  code.replace(pythonKeywords, (match) => {
    const start = code.indexOf(match, offset);
    matches.push({ start, end: start + match.length, type: "keyword", text: match });
    offset = start + match.length;
    return match;
  });
  offset = 0;
  code.replace(pythonBuiltins, (match) => {
    const start = code.indexOf(match, offset);
    matches.push({ start, end: start + match.length, type: "builtin", text: match });
    offset = start + match.length;
    return match;
  });
  offset = 0;
  code.replace(numbers, (match) => {
    const start = code.indexOf(match, offset);
    matches.push({ start, end: start + match.length, type: "number", text: match });
    offset = start + match.length;
    return match;
  });

  return matches;
}

function CodeHighlighter({ code }) {
  const matches = highlightPython(code);
  const colorMap = { keyword: "#569cd6", string: "#ce9178", comment: "#6a9955", builtin: "#4fc1ff", number: "#b5cea8" };
  const lines = code.split("\n");

  return (
    <div style={{ display: "flex", lineHeight: "1.6" }}>
      <div style={{ color: "#858585", paddingRight: "1.5rem", textAlign: "right", userSelect: "none", minWidth: "fit-content" }}>
        {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
      </div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", flex: 1, color: "#d4d4d4", fontFamily: "monospace" }}>
        {lines.map((line, lineNum) => (
          <div key={lineNum}>
            {line.split("").map((char, charIdx) => {
              let displayColor = "#d4d4d4";
              for (const match of matches) {
                const lineStart = code.substring(0, code.lastIndexOf("\n", code.indexOf(line))).split("\n").reduce((a, b) => a + b.length + 1, 0);
                const charPos = lineStart + charIdx;
                if (charPos >= match.start && charPos < match.end) { displayColor = colorMap[match.type]; break; }
              }
              return <span key={charIdx} style={{ color: displayColor }}>{char}</span>;
            })}
          </div>
        ))}
      </pre>
    </div>
  );
}

function formatOutput(value) {
  let data = value;
  if (typeof value === "string") {
    try { data = JSON.parse(value); } catch { return value; }
  }
  if (Array.isArray(data)) {
    const isSimple = data.every((item) => typeof item !== "object" || item === null || Object.keys(item).length === 0);
    if (isSimple && data.length <= 10) return JSON.stringify(data);
    const isSimpleNested = data.every((item) => Array.isArray(item) && item.every((el) => typeof el === "number" || typeof el === "string"));
    if (isSimpleNested) return data.map((arr) => `[${arr.join(", ")}]`).join("\n");
  }
  try { return JSON.stringify(data, null, 2); } catch { return String(data); }
}

function ScoreBar({ label, score, feedback }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "var(--success)" : score >= 4 ? "var(--warning)" : "var(--error)";
  return (
    <div className="rp-score-row">
      <div className="rp-score-meta">
        <span className="rp-score-label">{label}</span>
        <span className="rp-score-value" style={{ color }}>{score}<span className="rp-score-denom">/10</span></span>
      </div>
      <div className="rp-score-track">
        <div className="rp-score-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      {feedback && <p className="rp-score-feedback">{feedback}</p>}
    </div>
  );
}

function Collapsible({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rp-collapsible">
      <button type="button" className="rp-collapsible-header" onClick={() => setOpen(!open)}>
        <span className="rp-collapsible-arrow">{open ? "▼" : "▶"}</span>
        <span>{title}</span>
      </button>
      {open && <div className="rp-collapsible-body">{children}</div>}
    </div>
  );
}

function ReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppState();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTestCase, setSelectedTestCase] = useState(null);

  const sessionData = location.state?.sessionData;
  const sessionId = location.state?.sessionId;
  const stateTestResults = location.state?.testResults;
  const stateReview = location.state?.review;

  useEffect(() => {
    const loadInterview = async () => {
      try {
        if (sessionData) { setInterview(sessionData); setLoading(false); return; }
        if (sessionId) {
          const response = await fetch(`http://localhost:3001/api/interviews/${sessionId}`);
          if (!response.ok) throw new Error("Failed to fetch interview");
          const data = await response.json();
          if (stateTestResults) data.testResults = stateTestResults;
          if (stateReview) data.review = stateReview;
          setInterview(data);
        }
      } catch (err) {
        setError("Failed to load interview: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadInterview();
  }, [sessionData, sessionId]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this interview?")) return;
    try {
      const response = await fetch(`http://localhost:3001/api/interviews/${interview._id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete interview");
      navigate("/interviews/old");
    } catch (err) {
      alert("Failed to delete interview: " + err.message);
    }
  };

  if (loading) return <section className="page"><div className="card">Loading report...</div></section>;
  if (error) return <section className="page"><div className="card" style={{ color: "var(--error)" }}>{error}</div></section>;
  if (!interview) return <section className="page"><div className="card">Interview not found</div></section>;

  const timeSpent = interview.interview?.durationMinutes * 60 - interview.timeLeftSeconds;
  const tr = interview.testResults;
  const review = interview.review;
  const passed = tr?.passed;
  const hasStructuredReview = review && typeof review === "object" && review.logic;

  return (
    <section className="page rp-page">

      {/* Header */}
      <div className="rp-header">
        <Link to="/interviews/old" className="back-link">
          <FiArrowLeft /> Interviews
        </Link>
        <div className="rp-header-main">
          <div className="rp-header-left">
            <h1 className="rp-title">{interview.interview?.title}</h1>
            <div className="rp-chips">
              {interview.interview?.company && <span className="rp-chip">{interview.interview.company}</span>}
              {interview.interview?.difficulty && <span className={`rp-chip rp-chip--${interview.interview.difficulty.toLowerCase()}`}>{interview.interview.difficulty}</span>}
              <span className="rp-chip">{formatDate(interview.completedAt)}</span>
            </div>
          </div>
          {tr && (
            <div className={`rp-verdict ${passed ? "rp-verdict--pass" : "rp-verdict--fail"}`}>
              <span className="rp-verdict-icon">{passed ? "✓" : "✗"}</span>
              <span className="rp-verdict-label">{passed ? "Passed" : "Failed"}</span>
              <span className="rp-verdict-score">{tr.passedCount}/{tr.totalTests}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="rp-stats">
        <div className="rp-stat">
          <span className="rp-stat-label">Time Spent</span>
          <span className="rp-stat-value">{formatTime(timeSpent)}</span>
        </div>
        {tr && (
          <div className="rp-stat">
            <span className="rp-stat-label">Test Score</span>
            <span className="rp-stat-value">{tr.passPercentage}%</span>
          </div>
        )}
        {interview.code && (
          <div className="rp-stat">
            <span className="rp-stat-label">Code Length</span>
            <span className="rp-stat-value">{interview.code.length} chars</span>
          </div>
        )}
        {hasStructuredReview && (
          <div className="rp-stat">
            <span className="rp-stat-label">Avg Score</span>
            <span className="rp-stat-value">
              {(((review.logic?.score ?? 0) + (review.codeQuality?.score ?? 0) + (review.reasoning?.score ?? 0)) / 3).toFixed(1)}/10
            </span>
          </div>
        )}
      </div>

      {/* Two-column: scores + test cases */}
      {(hasStructuredReview || (tr?.testCases?.length > 0)) && (
        <div className="rp-two-col">
          {hasStructuredReview && (
            <div className="card rp-scores-card">
              <h2 className="rp-section-title">Performance</h2>
              <div className="rp-scores">
                <ScoreBar label="Logic" score={review.logic.score} feedback={review.logic.feedback} />
                <ScoreBar label="Code Quality" score={review.codeQuality.score} feedback={review.codeQuality.feedback} />
                <ScoreBar label="Reasoning" score={review.reasoning.score} feedback={review.reasoning.feedback} />
              </div>
              {review.summary && (
                <div className="rp-summary">
                  <p>{review.summary}</p>
                </div>
              )}
            </div>
          )}

          {tr?.testCases?.length > 0 && (
            <div className="card rp-tests-card">
              <h2 className="rp-section-title">Test Cases</h2>
              <div className="rp-test-grid">
                {tr.testCases.map((tc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`rp-test-tile ${tc.passed ? "rp-test-tile--pass" : "rp-test-tile--fail"}`}
                    onClick={() => setSelectedTestCase(tc)}
                  >
                    <span className="rp-test-tile-num">#{tc.testCaseId}</span>
                    <span className="rp-test-tile-status">{tc.passed ? "✓" : "✗"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legacy string review */}
      {review && typeof review === "string" && (
        <div className="card">
          <h2 className="rp-section-title">AI Review</h2>
          {review.split("\n").map((line, i) => {
            const heading = line.match(/^\*\*(.+?)\*\*(.*)$/);
            if (heading) return <p key={i}><strong>{heading[1]}</strong>{heading[2]}</p>;
            if (line.trim() === "") return <br key={i} />;
            return <p key={i}>{line}</p>;
          })}
        </div>
      )}

      {/* Transcript */}
      {interview.transcript && (
        <Collapsible title="Transcript" defaultOpen>
          <pre className="rp-preblock">{interview.transcript}</pre>
        </Collapsible>
      )}

      {/* Code */}
      {interview.code && (
        <Collapsible title="Code">
          <div className="rp-codebox">
            <CodeHighlighter code={interview.code} />
          </div>
        </Collapsible>
      )}

      {/* Actions */}
      <div className="rp-actions">
        <button type="button" className="ci-btn ci-btn--delete" onClick={handleDelete}>Delete</button>
        <button type="button" className="ci-btn" onClick={() => navigate("/interviews/old")}>Back</button>
      </div>

      {/* Test case modal */}
      {selectedTestCase && createPortal(
        <div className="modal-backdrop" onClick={() => setSelectedTestCase(null)}>
          <div className="modal-box modal-box--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Test Case {selectedTestCase.testCaseId}
                {selectedTestCase.description && `: ${selectedTestCase.description}`}
              </h2>
              <button type="button" className="modal-close" onClick={() => setSelectedTestCase(null)}>✕</button>
            </div>
            <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <span className={`rp-modal-badge ${selectedTestCase.passed ? "pass" : "fail"}`}>
                  {selectedTestCase.passed ? "✓ PASSED" : "✗ FAILED"}
                </span>
              </div>
              <div>
                <p className="rp-modal-label">Input</p>
                <pre className="rp-modal-code">{formatOutput(selectedTestCase.input)}</pre>
              </div>
              {!selectedTestCase.passed && selectedTestCase.actualOutput ? (
                <div className="rp-modal-comparison">
                  <div>
                    <p className="rp-modal-label">Expected</p>
                    <pre className="rp-modal-code">{formatOutput(selectedTestCase.expectedOutput)}</pre>
                  </div>
                  <div>
                    <p className="rp-modal-label" style={{ color: "var(--error)" }}>Actual</p>
                    <pre className="rp-modal-code rp-modal-code--error">{formatOutput(selectedTestCase.actualOutput)}</pre>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="rp-modal-label">Expected Output</p>
                  <pre className="rp-modal-code">{formatOutput(selectedTestCase.expectedOutput)}</pre>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="ci-btn ci-btn--primary" onClick={() => setSelectedTestCase(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}

export default ReportPage;
