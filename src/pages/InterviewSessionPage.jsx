import { useState } from "react";
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
  const [runOutput, setRunOutput] = useState("");
  const [runError, setRunError] = useState("");

  const handleRunCode = () => {
    setRunOutput("");
    setRunError("");

    const logs = [];
    const mockConsole = {
      log: (...args) => {
        logs.push(args.map((arg) => String(arg)).join(" "));
      },
    };

    try {
      const run = new Function("console", `"use strict";\n${code}`);
      const result = run(mockConsole);

      if (result !== undefined) {
        logs.push(`Return: ${String(result)}`);
      }

      setRunOutput(
        logs.length > 0 ? logs.join("\n") : "Code ran successfully.",
      );
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Execution failed.");
    }
  };

  const handleFinish = () => {
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
        <CodeEditor
          value={code}
          onChange={setCode}
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
      </div>
    </section>
  );
}

export default InterviewSessionPage;
