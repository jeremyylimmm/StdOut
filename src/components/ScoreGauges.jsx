function ScoreGauges({ review }) {
  // Handle case where review is a string (older interviews)
  if (typeof review === "string") {
    return null;
  }

  if (!review || !review.logic || !review.codeQuality || !review.reasoning) {
    return null;
  }

  const scores = [
    {
      label: "Logic",
      score: review.logic.score,
      feedback: review.logic.feedback,
    },
    {
      label: "Code Quality",
      score: review.codeQuality.score,
      feedback: review.codeQuality.feedback,
    },
    {
      label: "Reasoning",
      score: review.reasoning.score,
      feedback: review.reasoning.feedback,
    },
  ];

  return (
    <div className="score-gauges">
      {scores.map((item, idx) => (
        <div key={idx} className="score-gauge">
          <div className="score-gauge-header">
            <span className="score-gauge-label">{item.label}</span>
            <span className="score-gauge-value">{item.score}/10</span>
          </div>
          <div className="score-gauge-bar">
            <div
              className="score-gauge-fill"
              style={{ width: `${(item.score / 10) * 100}%` }}
            />
          </div>
          <div className="score-gauge-feedback">{item.feedback}</div>
        </div>
      ))}
    </div>
  );
}

export default ScoreGauges;
