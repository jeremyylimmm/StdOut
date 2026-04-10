function QuestionPanel({ question }) {
  return (
    <div className="card question-card">
      <h3>Question</h3>
      <h4>{question?.title || "No question loaded"}</h4>
      <p>
        {question?.description ||
          "Please start an interview to view a question."}
      </p>
    </div>
  );
}

export default QuestionPanel;
