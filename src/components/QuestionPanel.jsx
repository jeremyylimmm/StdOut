import Timer from "./Timer";

function QuestionPanel({ question, timerRef, initialSeconds }) {
  return (
    <div className="card question-card">
      <div className="question-header">
        <h3>Question</h3>
        <Timer ref={timerRef} initialSeconds={initialSeconds} />
      </div>
      <h4>{question?.title || "No question loaded"}</h4>
      <p>
        {question?.description ||
          "Please start an interview to view a question."}
      </p>
    </div>
  );
}

export default QuestionPanel;
