import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { diffLines } from "diff";
import CodeEditor from "../components/CodeEditor";
import QuestionPanel from "../components/QuestionPanel";
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
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunkIntervalRef = useRef(null);
  const timelineRef = useRef([]);
  const prevCodeRef = useRef("");
  const codeDebounceRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const timelineEndRef = useRef(null);
  const timerRef = useRef(null);
  const pcRef = useRef(null);
  const streamRef = useRef(null);
  const channelRef = useRef(null);
  const codeRef = useRef("");

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

  function buildSessionInstructions(currentCode) {
    return `SYSTEM: You are a strict technical interview assistant. You have one job only.

QUESTION THE CANDIDATE IS SOLVING:
Title: ${currentQuestion?.title ?? "Unknown"}
Description: ${currentQuestion?.description ?? "No description provided"}
Difficulty: ${currentQuestion?.difficulty ?? "Unknown"}

CANDIDATE'S CURRENT CODE:
\`\`\`
${currentCode || "(no code written yet)"}
\`\`\`

ABSOLUTE RULES - NEVER BREAK THESE:
1. You ONLY discuss the question above. Any other topic: say "I can only discuss the interview question."
2. Ask ONE clarifying question at a time about logic or reasoning only.
3. NEVER reveal the answer or write code for the candidate.
4. Hints must be vague - point to a concept, never a solution.
5. Keep every response under 20 seconds of speech.
6. Be strict but fair in your assessment of their reasoning.
7. When asked about their code, refer to the current code block above.`;
  }

  useEffect(() => {
    if (currentQuestion?.initialCode) {
      setCode(currentQuestion.initialCode);
      prevCodeRef.current = currentQuestion.initialCode;
      codeRef.current = currentQuestion.initialCode;
    }
  }, [currentQuestion]);

  useEffect(() => {
    if (!currentQuestion) return;

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    startRealtime();

    return () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [currentQuestion]);

  useEffect(() => {
    let stopped = false;

    async function startRecording() {
      let attempts = 0;
      while (!streamRef.current && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }

      let stream;
      if (streamRef.current) {
        stream = streamRef.current;
      } else {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
        } catch (err) {
          setError("Mic error: " + err.message);
          return;
        }
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

  async function startRealtime() {
    try {
      const tokenResponse = await fetch("http://localhost:3001/api/realTime/session");
      const sessionData = await tokenResponse.json();

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const channel = pc.createDataChannel("oai-events");
      channelRef.current = channel;

      // Listen for AI responses and add them to the timeline
      channel.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "response.audio_transcript.done") {
            const text = msg.transcript?.trim();
            if (text) {
              pushEvent({
                type: "ai",
                content: text,
                timestamp: getTimestamp(),
              });
            }
          }
        } catch (err) {
          // ignore parse errors
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      channel.onopen = () => {
        channel.send(JSON.stringify({
          type: "session.update",
          session: {
            instructions: buildSessionInstructions(codeRef.current),
          },
        }));

        channel.send(JSON.stringify({
          type: "response.create",
          response: {
            modalities: ["audio", "text"],
            instructions: `Greet the candidate with exactly: "Hi, welcome to the technical interview, start when you are ready." Say nothing else.`,
          },
        }));
      };

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const audio = document.createElement("audio");
      audio.autoplay = true;

      pc.ontrack = (event) => {
        audio.srcObject = event.streams[0];
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${sessionData.client_secret.value}`,
            "Content-Type": "application/sdp",
          },
        }
      );

      const answer = {
        type: "answer",
        sdp: await response.text(),
      };

      await pc.setRemoteDescription(answer);
    } catch (err) {
      console.error("Realtime setup failed:", err);
      setError("Realtime AI setup failed: " + err.message);
    }
  }

  function handleCodeChange(newCode) {
    setCode(newCode);
    codeRef.current = newCode;

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

      if (channelRef.current?.readyState === "open") {
        channelRef.current.send(JSON.stringify({
          type: "session.update",
          session: {
            instructions: buildSessionInstructions(newCode),
          },
        }));
      }
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
    setSubmitting(true);
    setSubmitStep("Stopping recording...");
    await new Promise((resolve) => setTimeout(resolve, 0));

    clearTimeout(chunkIntervalRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    const transcript = timelineRef.current
      .map((event) => `[${event.timestamp}] ${event.type}: ${event.content}`)
      .join("\n");

    const timeLeft = timerRef.current?.getTimeLeft() || 0;

    let testResults = null;
    if (currentQuestion?._id) {
      setSubmitStep("Running test cases...");
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
        } else {
          console.error("Submit response not ok:", response.status);
        }
      } catch (error) {
        console.error("Error submitting code for testing:", error);
      }
    }

    setSubmitStep("Generating AI review...");
    let review = null;
    try {
      const res = await fetch("http://localhost:3001/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, code, question: currentQuestion?.title }),
      });
      const data = await res.json();
      review = data.review;
    } catch (err) {
      console.error("Review failed:", err);
    }

    setSubmitStep("Saving session...");
    const sessionId = await saveInterview(transcript, code, timeLeft, testResults, review);

    navigate("/report", {
      state: { sessionId },
    });
  };

  return (
    <section className="page leetcode-layout">
      <div className="question-panel-wrap">
        <QuestionPanel question={currentQuestion} timerRef={timerRef} initialSeconds={settings.durationMinutes * 60} />
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
                ) : event.type === "ai" ? (
                  <div>
                    <div className="timeline-label">interviewer</div>
                    <span className="timeline-ai">{event.content}</span>
                  </div>
                ) : event.type === "output" ? (
                  <div>
                    <div className="timeline-label">
                      {event.error ? "error" : "output"}
                    </div>
                    <pre className={`timeline-diff ${event.error ? "timeline-output-error" : "timeline-output-ok"}`}>
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
      </div>

      <div className="editor-panel-wrap">
        <CodeEditor value={code} onChange={handleCodeChange} onRun={handleRunCode} onSubmit={handleFinish} />
        <div className="card terminal-card">
          <pre className={`run-output terminal-output ${runError ? "error" : ""}`}>
            {runError || runOutput || "Run your code to see output here..."}
          </pre>
        </div>
      </div>
      {submitting && createPortal(
        <div className="submit-overlay">
          <div className="submit-overlay-box">
            <div className="submit-spinner" />
            <p className="submit-overlay-step">{submitStep}</p>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}

export default InterviewSessionPage;