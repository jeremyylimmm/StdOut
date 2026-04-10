import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import QuestionPanel from "../components/QuestionPanel";
import Timer from "../components/Timer";
import { useAppState } from "../lib/AppStateContext";

function InterviewSessionPage() {
  const navigate = useNavigate();
  const { currentQuestion, settings } = useAppState();

  const [code, setCode] = useState("");
  const [runOutput, setRunOutput] = useState("");
  const [runError, setRunError] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const interimRef = useRef("");
  const restartingRef = useRef(false);

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
          setTranscript((prev) => prev + result[0].transcript + " ");
          interimRef.current = "";
        } else {
          interim += result[0].transcript;
        }
      }
      interimRef.current = interim;

      // Trigger re-render to show interim text
      setIsRecording((v) => v);
    };

    // no speech and aborted require restart
    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError("Mic error: " + event.error);
      setIsRecording(false);
    };

    // The browser stops recognition after a period of silence
    recognition.onend = () => {
      if (restartingRef.current) return;
      restartingRef.current = true;
      try {
        recognition.start();
      } catch (err) {
        // Already started, ignore
      }
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
    // Stop recording before navigating
    restartingRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
    navigate("/results", {
      state: {
        questionsAttempted: 1,
        codeLength: code.length,
      },
    });
  };

  return (
    <section className="page session-layout leetcode-layout">
      <div className="question-panel-wrap">
        <QuestionPanel question={currentQuestion} />

        <div className="voice-input">
          <div className="mic-status">
            {isRecording ? (
              <span className="recording-indicator"> Live </span>
            ) : (
              <span>Microphone inactive</span>
            )}
          </div>
          {error && <p className="mic-error">{error}</p>}
          <textarea
            readOnly
            className="transcript-box"
            placeholder="Transcription will appear here as you speak..."
            value={transcript + interimRef.current}
          />
          {transcript && (
            <button type="button" onClick={() => setTranscript("")}>
              Clear
            </button>
          )}
        </div>

        <Timer initialSeconds={settings.durationMinutes * 60} />
      </div>

      <div className="editor-panel-wrap">
        <CodeEditor value={code} onChange={setCode} />

        <div className="card terminal-card">
          <h3>Terminal</h3>
          <pre
            className={`run-output terminal-output ${runError ? "error" : ""}`}
          >
            {runError || runOutput || "Run your code to see output here."}
          </pre>
          <div className="session-actions">
            <button type="button" onClick={handleRunCode}>
              Run
            </button>
            <button type="button" onClick={handleFinish}>
              Submit
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default InterviewSessionPage;
