import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { diffLines } from "diff";
import CodeEditor from "../components/CodeEditor";
import QuestionPanel from "../components/QuestionPanel";
import Timer from "../components/Timer";
import { useAppState } from "../lib/AppStateContext";

function InterviewSessionPage() {
  const navigate = useNavigate();
  const { currentQuestion, questionIndex, questions, nextQuestion, settings } =
    useAppState();

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
    timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline]);

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
          pushEvent({ type: "speech", content: text, timestamp: getTimestamp() });
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
            .join("\n")
        )
        .join("\n");

      if (diffText) {
        pushEvent({ type: "code", content: diffText, timestamp: getTimestamp() });
      }

      prevCodeRef.current = newCode;
    }, 1500);
  }

  const handleRunCode = async () => {
    setRunOutput("");
    setRunError("");

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.stderr) {
        setRunError(data.stderr);
      } else {
        setRunOutput(data.stdout || "Code ran successfully.");
      }
    } catch (err) {
      setRunError("Failed to reach the server.");
    }
  };

  const handleFinish = () => {
    restartingRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
    navigate("/results", {
      state: {
        questionsAttempted: questionIndex + 1,
        codeLength: code.length,
        timeline: timelineRef.current,
      },
    });
  };

  return (
    <section className="page session-layout">
      <div className="stack">
        <QuestionPanel
          question={currentQuestion}
          currentIndex={questionIndex}
          total={questions.length}
        />
        <CodeEditor
          value={code}
          onChange={handleCodeChange}
          onRun={handleRunCode}
          output={runOutput}
          error={runError}
        />
      </div>
      <div className="stack">
        <Timer initialSeconds={settings.durationMinutes * 60} />
        <button
          type="button"
          onClick={nextQuestion}
          disabled={questionIndex === questions.length - 1}
        >
          Next Question
        </button>
        <button type="button" onClick={handleFinish}>
          Finish Interview
        </button>

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
              <p className="timeline-empty">Events will appear here as you speak and type...</p>
            )}
            {timeline.map((event, i) => (
              <div key={i} className={`timeline-event timeline-${event.type}`}>
                <span className="timeline-ts">{event.timestamp}</span>
                {event.type === "speech" ? (
                  <span className="timeline-speech">{event.content}</span>
                ) : (
                  <pre className="timeline-diff">{event.content}</pre>
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
      </div>
    </section>
  );
}

export default InterviewSessionPage;
