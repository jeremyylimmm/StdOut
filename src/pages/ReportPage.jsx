import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";
import ScoreGauges from "../components/ScoreGauges";
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

// Python syntax highlighter
function highlightPython(code) {
  const pythonKeywords =
    /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|assert|break|continue|del|global|nonlocal|pass|raise|and|or|not|in|is|True|False|None)\b/g;
  const pythonBuiltins =
    /\b(print|len|range|str|int|float|list|dict|set|tuple|sum|max|min|enumerate|zip|map|filter|sorted|reversed|open|input|type|isinstance|hasattr|getattr|setattr|callable)\b/g;
  const strings = /(['"`])(?:(?=(\\?))\2.)*?\1/g;
  const comments = /#.*$/gm;
  const numbers = /\b\d+\.?\d*\b/g;

  let highlighted = code;
  let offset = 0;

  const matches = [];

  code.replace(comments, (match, index) => {
    matches.push({
      start: code.indexOf(match, offset),
      end: code.indexOf(match, offset) + match.length,
      type: "comment",
      text: match,
    });
    offset = code.indexOf(match, offset) + match.length;
    return match;
  });

  offset = 0;
  code.replace(strings, (match, index) => {
    matches.push({
      start: code.indexOf(match, offset),
      end: code.indexOf(match, offset) + match.length,
      type: "string",
      text: match,
    });
    offset = code.indexOf(match, offset) + match.length;
    return match;
  });

  offset = 0;
  code.replace(pythonKeywords, (match, index) => {
    const start = code.indexOf(match, offset);
    matches.push({
      start,
      end: start + match.length,
      type: "keyword",
      text: match,
    });
    offset = start + match.length;
    return match;
  });

  offset = 0;
  code.replace(pythonBuiltins, (match, index) => {
    const start = code.indexOf(match, offset);
    matches.push({
      start,
      end: start + match.length,
      type: "builtin",
      text: match,
    });
    offset = start + match.length;
    return match;
  });

  offset = 0;
  code.replace(numbers, (match, index) => {
    const start = code.indexOf(match, offset);
    matches.push({
      start,
      end: start + match.length,
      type: "number",
      text: match,
    });
    offset = start + match.length;
    return match;
  });

  return matches;
}

function CodeHighlighter({ code }) {
  const matches = highlightPython(code);
  const colorMap = {
    keyword: "#569cd6",
    string: "#ce9178",
    comment: "#6a9955",
    builtin: "#4fc1ff",
    number: "#b5cea8",
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
                const lineStart = code
                  .substring(0, code.lastIndexOf("\n", code.indexOf(line)))
                  .split("\n")
                  .reduce((a, b, i) => a + b.length + 1, 0);
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

// Expandable Section Component
function ExpandableSection({
  title,
  children,
  defaultOpen = false,
  badge = null,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="expandable-section">
      <button
        type="button"
        className="expandable-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="expandable-toggle">{isOpen ? "▼" : "▶"}</span>
        <span className="expandable-title">{title}</span>
        {badge && (
          <span className={`expandable-badge ${badge.variant}`}>
            {badge.text}
          </span>
        )}
      </button>
      {isOpen && <div className="expandable-body">{children}</div>}
    </div>
  );
}

// Helper to format JSON output
function formatOutput(value) {
  // Parse strings that might be JSON
  let data = value;
  if (typeof value === "string") {
    try {
      data = JSON.parse(value);
    } catch {
      // If not JSON, return as-is (for error messages, etc.)
      return value;
    }
  }

  // Custom formatting for better readability
  // Check if it's a simple array (all primitives)
  if (Array.isArray(data)) {
    const isSimple = data.every(
      (item) =>
        typeof item !== "object" ||
        item === null ||
        Object.keys(item).length === 0,
    );
    if (isSimple && data.length <= 10) {
      // Format as single-line for simple arrays
      return JSON.stringify(data);
    }

    // For nested arrays with simple numbers, use compact format
    const isSimpleNested =
      Array.isArray(data) &&
      data.every(
        (item) =>
          Array.isArray(item) &&
          item.every((el) => typeof el === "number" || typeof el === "string"),
      );
    if (isSimpleNested) {
      return data.map((arr) => `[${arr.join(", ")}]`).join("\n");
    }
  }

  // For complex objects, use pretty formatting
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function ReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppState();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTestCase, setSelectedTestCase] = useState(null);

  // Get data from location.state
  const sessionData = location.state?.sessionData;
  const sessionId = location.state?.sessionId;
  const stateTestResults = location.state?.testResults;
  const stateReview = location.state?.review;

  useEffect(() => {
    const loadInterview = async () => {
      try {
        // If sessionData provided, use it directly
        if (sessionData) {
          setInterview(sessionData);
          setLoading(false);
          return;
        }

        // Otherwise fetch from backend if sessionId provided
        if (sessionId) {
          const response = await fetch(
            `http://localhost:3001/api/interviews/${sessionId}`,
          );
          if (!response.ok) throw new Error("Failed to fetch interview");
          const data = await response.json();

          // Merge state data (from results page) with fetched data
          if (stateTestResults) {
            data.testResults = stateTestResults;
          }
          if (stateReview) {
            data.review = stateReview;
          }

          setInterview(data);
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
      const response = await fetch(
        `http://localhost:3001/api/interviews/${interview._id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) throw new Error("Failed to delete interview");

      navigate("/interviews/old");
    } catch (err) {
      alert("Failed to delete interview: " + err.message);
    }
  };

  if (loading)
    return (
      <section className="page">
        <div className="card">Loading report...</div>
      </section>
    );
  if (error)
    return (
      <section className="page">
        <div className="card" style={{ color: "var(--error)" }}>
          {error}
        </div>
      </section>
    );
  if (!interview)
    return (
      <section className="page">
        <div className="card">Interview not found</div>
      </section>
    );

  const timeSpent =
    interview.interview?.durationMinutes * 60 - interview.timeLeftSeconds;

  return (
    <section className="page">
      <Link to="/interviews/old" className="back-link">
        <FiArrowLeft /> Back to Interviews
      </Link>

      {/* Interview Summary */}
      <div className="card">
        <h1>{interview.interview?.title}</h1>
        <div className="report-summary">
          <p>
            <strong>Company:</strong> {interview.interview?.company}
          </p>
          <p>
            <strong>Difficulty:</strong> {interview.interview?.difficulty}
          </p>
          <p>
            <strong>Date:</strong> {formatDate(interview.completedAt)}
          </p>
          <p>
            <strong>Time Spent:</strong> {formatTime(timeSpent)}
          </p>
          {interview.code && (
            <p>
              <strong>Code Length:</strong> {interview.code.length} characters
            </p>
          )}
        </div>

        {/* Test Results Summary */}
        {interview.testResults && (
          <div className="test-results">
            <p className="score">
              Score: {interview.testResults.passPercentage}% (
              {interview.testResults.passedCount}/
              {interview.testResults.totalTests} tests passed)
            </p>
            {interview.testResults.passed ? (
              <p className="test-status passed">✓ All test cases passed!</p>
            ) : (
              <p className="test-status failed">
                ✗{" "}
                {interview.testResults.totalTests -
                  interview.testResults.passedCount}{" "}
                test case(s) failed
              </p>
            )}
          </div>
        )}
      </div>

      {/* Performance Analysis with Score Gauges */}
      {interview.review && typeof interview.review === "object" && (
        <div className="card">
          <h2>Performance Analysis</h2>
          <ScoreGauges review={interview.review} />
          {interview.review.summary && (
            <div className="score-summary">
              <h3>Overall Summary</h3>
              <p>{interview.review.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* AI Review Section - for legacy string reviews */}
      {interview.review && typeof interview.review === "string" && (
        <div className="card review-card">
          <h2>AI Review</h2>
          {interview.review.split("\n").map((line, i) => {
            const heading = line.match(/^\*\*(.+?)\*\*(.*)$/);
            if (heading)
              return (
                <p key={i}>
                  <strong>{heading[1]}</strong>
                  {heading[2]}
                </p>
              );
            if (line.trim() === "") return <br key={i} />;
            return <p key={i}>{line}</p>;
          })}
        </div>
      )}

      {/* Transcript Section */}
      {interview.transcript && (
        <ExpandableSection title="Transcript" defaultOpen={true}>
          <div className="expandable-content-box">{interview.transcript}</div>
        </ExpandableSection>
      )}

      {/* Code Section */}
      {interview.code && (
        <ExpandableSection title="Code">
          <div className="expandable-code-box">
            <CodeHighlighter code={interview.code} />
          </div>
        </ExpandableSection>
      )}

      {/* Test Cases Grid */}
      {interview.testResults?.testCases &&
        interview.testResults.testCases.length > 0 && (
          <div className="card">
            <h2>Test Cases</h2>
            <div className="test-cases-grid">
              {interview.testResults.testCases.map((testCase, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`test-case-box ${testCase.passed ? "passed" : "failed"}`}
                  onClick={() => setSelectedTestCase(testCase)}
                >
                  <div className="test-case-box-number">
                    Test {testCase.testCaseId}
                  </div>
                  <div
                    className={`test-case-box-status ${testCase.passed ? "passed" : "failed"}`}
                  >
                    {testCase.passed ? "✓ PASSED" : "✗ FAILED"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      {/* Test Case Modal */}
      {selectedTestCase && (
        <div
          className="test-case-modal-backdrop"
          onClick={() => setSelectedTestCase(null)}
        >
          <div className="test-case-modal" onClick={(e) => e.stopPropagation()}>
            <div className="test-case-modal-header">
              <h2 className="test-case-modal-title">
                Test Case {selectedTestCase.testCaseId}
                {selectedTestCase.description &&
                  `: ${selectedTestCase.description}`}
              </h2>
              <button
                type="button"
                className="test-case-modal-close"
                onClick={() => setSelectedTestCase(null)}
              >
                ✕
              </button>
            </div>

            <div className="test-case-modal-body">
              <div className="test-case-modal-section">
                <h4>Status</h4>
                <div>
                  <span
                    className={`test-case-modal-badge ${selectedTestCase.passed ? "passed" : "failed"}`}
                  >
                    {selectedTestCase.passed ? "✓ PASSED" : "✗ FAILED"}
                  </span>
                </div>
              </div>

              <div className="test-case-modal-section">
                <h4>Input</h4>
                <pre className="test-case-modal-code">
                  {formatOutput(selectedTestCase.input)}
                </pre>
              </div>

              {!selectedTestCase.passed && selectedTestCase.actualOutput ? (
                // Side-by-side comparison for failed tests
                <div className="test-case-modal-section">
                  <h4 style={{ marginBottom: "1rem" }}>Output Comparison</h4>
                  <div className="test-case-output-comparison">
                    <div className="test-case-output-expected">
                      <div className="test-case-output-label">Expected</div>
                      <pre className="test-case-modal-code">
                        {formatOutput(selectedTestCase.expectedOutput)}
                      </pre>
                    </div>
                    <div className="test-case-output-actual">
                      <div className="test-case-output-label">Actual</div>
                      <pre className="test-case-modal-code error">
                        {formatOutput(selectedTestCase.actualOutput)}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                // For passed tests, just show expected output
                <div className="test-case-modal-section">
                  <h4>Expected Output</h4>
                  <pre className="test-case-modal-code">
                    {formatOutput(selectedTestCase.expectedOutput)}
                  </pre>
                </div>
              )}
            </div>

            <div className="test-case-modal-footer">
              <button
                type="button"
                className="ci-btn ci-btn--primary"
                onClick={() => setSelectedTestCase(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="report-actions">
        <button
          type="button"
          className="ci-btn ci-btn--delete"
          onClick={handleDelete}
        >
          Delete Interview
        </button>
        <button
          type="button"
          className="ci-btn ci-btn--primary"
          onClick={() => navigate("/interviews/old")}
        >
          Back to Interviews
        </button>
      </div>
    </section>
  );
}

export default ReportPage;
