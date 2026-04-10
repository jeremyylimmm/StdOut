import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import QuestionPanel from "../components/QuestionPanel";
import Timer from "../components/Timer";
import { useAppState } from "../lib/AppStateContext";

function InterviewSessionPage() {
  const navigate = useNavigate();
  const { currentQuestion, questionIndex, questions, nextQuestion, settings } =
    useAppState();

  const [code, setCode] = useState("");
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
        questionsAttempted: questionIndex + 1,
        codeLength: code.length,
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
        <CodeEditor value={code} onChange={setCode} />
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

        {/* Voice Transcript */}
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
      </div>
    </section>
  );
}

export default InterviewSessionPage;