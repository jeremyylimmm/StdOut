function QuestionPanel({ question, currentIndex, total }) {
  return (
    <div className="card">
      <h3>Question {currentIndex + 1}</h3>
      <h4>{question?.title || "No question loaded"}</h4>
      <p>
        {question?.description ||
          "Please start an interview to view a question."}
      </p>
      <small>
        {currentIndex + 1} / {total}
      </small>
    </div>
  );
}

export default QuestionPanel;
