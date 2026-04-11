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

  const mediaRecorderRef = useRef(null);
  const chunkIntervalRef = useRef(null);
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

  function tsToSeconds(ts) {
    const [m, s] = ts.split(":").map(Number);
    return m * 60 + s;
  }

  function pushEvent(event) {
    const incoming = tsToSeconds(event.timestamp);
    const list = timelineRef.current;
    let insertAt = list.length;
    for (let i = list.length - 1; i >= 0; i--) {
      if (tsToSeconds(list[i].timestamp) <= incoming) break;
      insertAt = i;
    }
    const updated = [...list.slice(0, insertAt), event, ...list.slice(insertAt)];
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
    let stopped = false;

    async function startRecording() {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        setError("Mic error: " + err.message);
        return;
      }

      setIsRecording(true);

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const pcmData = new Float32Array(analyser.fftSize);

      function getRMS() {
        analyser.getFloatTimeDomainData(pcmData);
        let sum = 0;
        for (const v of pcmData) sum += v * v;
        return Math.sqrt(sum / pcmData.length);
      }

      function recordChunk() {
        if (stopped) return;

        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          if (chunks.length === 0) { if (!stopped) recordChunk(); return; }
          const blob = new Blob(chunks, { type: recorder.mimeType });
          if ((recorder._speechMs?.() ?? 0) < 400) { if (!stopped) recordChunk(); return; }

          const formData = new FormData();
          formData.append("audio", blob, "audio.webm");

          try {
            const res = await fetch("http://localhost:3001/api/transcribe", {
              method: "POST",
              body: formData,
            });
            const data = await res.json();
            const text = data.text?.trim();
            if (text) {
              pushEvent({ type: "speech", content: text, timestamp: chunkStartTimestamp });
            }
          } catch (err) {
            // silently ignore transcription errors
          }

          if (!stopped) recordChunk();
        };

        const chunkStartTimestamp = getTimestamp();
        recorder.start();
        mediaRecorderRef.current = recorder;

        const MAX_DURATION = 10000;
        const SPEECH_THRESHOLD = 0.03;
        const SILENCE_DURATION = 700;
        const MIN_SPEECH_MS = 400; // must have this much speech to send
        let silenceStart = null;
        let speechMs = 0;
        let lastTick = Date.now();
        const startedAt = Date.now();

        const vadInterval = setInterval(() => {
          if (recorder.state !== "recording") { clearInterval(vadInterval); return; }

          const now = Date.now();
          const dt = now - lastTick;
          lastTick = now;
          const rms = getRMS();
          const elapsed = now - startedAt;

          if (rms >= SPEECH_THRESHOLD) {
            speechMs += dt;
            silenceStart = null;
          } else {
            if (silenceStart === null) silenceStart = now;
            else if (now - silenceStart >= SILENCE_DURATION && elapsed >= 500) {
              clearInterval(vadInterval);
              recorder.stop();
            }
          }

          if (elapsed >= MAX_DURATION) {
            clearInterval(vadInterval);
            recorder.stop();
          }
        }, 50);

        // store speechMs ref so onstop can read it
        recorder._speechMs = () => speechMs;

        chunkIntervalRef.current = vadInterval;
      }

      recordChunk();

      return () => audioCtx.close();
    }

    let cleanup = () => {};
    startRecording().then((fn) => { if (fn) cleanup = fn; });

    return () => {
      stopped = true;
      clearInterval(chunkIntervalRef.current);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      cleanup();
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
    clearTimeout(chunkIntervalRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);

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
