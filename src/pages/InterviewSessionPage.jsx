import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { diffLines } from "diff";
import CodeEditor from "../components/CodeEditor";
import QuestionPanel from "../components/QuestionPanel";
import Timer from "../components/Timer";
import { useAppState } from "../lib/AppStateContext";

function InterviewSessionPage() {
  const navigate = useNavigate();
  const { currentQuestion, settings, saveInterview } = useAppState();

  const [code, setCode] = useState("");
  const [runOutput, setRunOutput] = useState("");
  const [runError, setRunError] = useState("");
  const [timeline, setTimeline] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  const interimRef = useRef("");
  const restartingRef = useRef(false);
  const timelineRef = useRef([]);
  const prevCodeRef = useRef("");
  const codeDebounceRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const timelineEndRef = useRef(null);
  const timerRef = useRef(null);

  function getTimestamp() {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const s = String(elapsed % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function pushEvent(event) {
    const updated = [...timelineRef.current, event];
    timelineRef.current = updated;
    setTimeline(updated);
  }

  useEffect(() => {
    // Initialize code editor with the question's initial code
    if (currentQuestion?.initialCode) {
      setCode(currentQuestion.initialCode);
      prevCodeRef.current = currentQuestion.initialCode;
    }
  }, [currentQuestion]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsRecording(true);
      restartingRef.current = false;
    };

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          interimRef.current = "";
          pushEvent({
            type: "speech",
            content: text,
            timestamp: getTimestamp(),
          });
        } else {
          interim += result[0].transcript;
        }
      }
      interimRef.current = interim;
      setIsRecording((v) => v);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError("Mic error: " + event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      if (restartingRef.current) return;
      restartingRef.current = true;
      try {
        recognition.start();
      } catch (err) {}
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      setError(err.message);
    }

    return () => {
      restartingRef.current = true;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch (err) {}
    };
  }, []);

  function handleCodeChange(newCode) {
    setCode(newCode);

    clearTimeout(codeDebounceRef.current);
    codeDebounceRef.current = setTimeout(() => {
      const prev = prevCodeRef.current;
      if (newCode === prev) return;

      const hunks = diffLines(prev, newCode);
      const diffText = hunks
        .filter((h) => h.added || h.removed)
        .map((h) =>
          h.value
            .trimEnd()
            .split("\n")
            .map((line) => (h.added ? `+ ${line}` : `- ${line}`))
            .join("\n"),
        )
        .join("\n");

      if (diffText) {
        pushEvent({
          type: "code",
          content: diffText,
          timestamp: getTimestamp(),
        });
      }

      prevCodeRef.current = newCode;
    }, 1500);
  }

  const handleRunCode = async () => {
    setRunOutput("");
    setRunError("");

    try {
      const res = await fetch("http://localhost:3001/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.stderr) {
        setRunError(data.stderr);
        pushEvent({
          type: "output",
          content: data.stderr,
          error: true,
          timestamp: getTimestamp(),
        });
      } else {
        const output = data.stdout || "Code ran successfully.";
        setRunOutput(output);
        pushEvent({
          type: "output",
          content: output,
          error: false,
          timestamp: getTimestamp(),
        });
      }
    } catch (err) {
      setRunError("Failed to reach the server.");
    }
  };

  const handleFinish = async () => {
    restartingRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }

    // Convert timeline to transcript string
    const transcript = timelineRef.current
      .map((event) => `[${event.timestamp}] ${event.type}: ${event.content}`)
      .join("\n");

    // Get remaining time from timer
    const timeLeft = timerRef.current?.getTimeLeft() || 0;

    // Submit code for testing
    let testResults = null;
    if (currentQuestion?._id) {
      try {
        const response = await fetch(
          `http://localhost:3001/api/questions/${currentQuestion._id}/submit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          }
        );
        if (response.ok) {
          testResults = await response.json();
        }
      } catch (error) {
        console.error("Error submitting code for testing:", error);
      }
    }

    // Save the interview session with test results
    await saveInterview(transcript, code, timeLeft, testResults);

    // Calculate time spent (in seconds)
    const initialTimeSeconds = 15 * 60; // 15 minutes default
    const timeSpentSeconds = initialTimeSeconds - timeLeft;

    navigate("/results", {
      state: {
        timeSpentSeconds,
        codeLength: code.length,
        timeline: timelineRef.current,
        testResults,
      },
    });
  };

  return (
    <section className="page leetcode-layout">
      {/* Left: question + timeline + timer + finish */}
      <div className="question-panel-wrap">
        <QuestionPanel question={currentQuestion} />
        <div className="card timeline-widget">
          <div className="timeline-header">
            <span>Timeline</span>
            {isRecording ? (
              <span className="recording-indicator">Live</span>
            ) : (
              <span className="mic-inactive">Mic inactive</span>
            )}
          </div>
          {error && <p className="mic-error">{error}</p>}
          <div className="timeline-scroll">
            {timeline.length === 0 && (
              <p className="timeline-empty">
                Events will appear here as you speak and type...
              </p>
            )}
            {timeline.map((event, i) => (
              <div key={i} className={`timeline-event timeline-${event.type}`}>
                <span className="timeline-ts">{event.timestamp}</span>
                {event.type === "speech" ? (
                  <span className="timeline-speech">{event.content}</span>
                ) : event.type === "output" ? (
                  <div>
                    <div className="timeline-label">
                      {event.error ? "error" : "output"}
                    </div>
                    <pre
                      className={`timeline-diff ${event.error ? "timeline-output-error" : "timeline-output-ok"}`}
                    >
                      {event.content}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <div className="timeline-label">code</div>
                    <pre className="timeline-diff">{event.content}</pre>
                  </div>
                )}
              </div>
            ))}
            {interimRef.current && (
              <div className="timeline-event timeline-interim">
                <span className="timeline-ts">...</span>
                <span>{interimRef.current}</span>
              </div>
            )}
            <div ref={timelineEndRef} />
          </div>
        </div>
        <Timer ref={timerRef} initialSeconds={settings.durationMinutes * 60} />
        <div className="session-actions">
          <button type="button" onClick={handleFinish}>
            Finish Interview
          </button>
        </div>
      </div>

      {/* Right: editor + terminal */}
      <div className="editor-panel-wrap">
        <CodeEditor value={code} onChange={handleCodeChange} />
        <div className="card terminal-card">
          <button type="button" onClick={handleRunCode}>
            Run Code
          </button>
          <pre
            className={`run-output terminal-output ${runError ? "error" : ""}`}
          >
            {runError || runOutput || "Run your code to see output here..."}
          </pre>
        </div>
      </div>
    </section>
  );
}

export default InterviewSessionPage;
