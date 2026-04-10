function ResultsCard({ user, settings, questionsAttempted, codeLength }) {
  const score = Math.min(100, 60 + questionsAttempted * 10);

  return (
    <div className="card">
      <h2>Interview Summary</h2>
      <p>Candidate: {user?.name || "Unknown"}</p>
      <p>Role: {settings.role}</p>
      <p>Difficulty: {settings.difficulty}</p>
      <p>Duration: {settings.durationMinutes} minutes</p>
      <p>Questions Attempted: {questionsAttempted}</p>
      <p>Code Length: {codeLength} characters</p>
      <p className="score">Mock Score: {score}%</p>
    </div>
  );
}

export default ResultsCard;
