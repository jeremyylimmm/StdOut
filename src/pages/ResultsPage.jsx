import { useLocation, useNavigate } from "react-router-dom";
import ResultsCard from "../components/ResultsCard";
import { useAppState } from "../lib/AppStateContext";

function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, resetInterview } = useAppState();

  const timeSpentSeconds = location.state?.timeSpentSeconds ?? 0;
  const codeLength = location.state?.codeLength ?? 0;
  const testResults = location.state?.testResults;
  const review = location.state?.review;

  console.log(review);

  const handleTryAgain = () => {
    resetInterview();
    navigate("/interview/setup");
  };

  return (
    <section className="page narrow">
      <ResultsCard
        settings={settings}
        timeSpentSeconds={timeSpentSeconds}
        codeLength={codeLength}
        testResults={testResults}
      />

  {review && (
    <div className="card review-card">
      <h2>AI Review</h2>
      {review.split("\n").map((line, i) => {
        const heading = line.match(/^\*\*(.+?)\*\*(.*)$/);
        if (heading) return (
          <p key={i}>
            <strong>{heading[1]}</strong>{heading[2]}
          </p>
        );
        if (line.trim() === "") return <br key={i} />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  )}
      <button type="button" onClick={handleTryAgain}>
        Start New Interview
      </button>
    </section>
  );
}

export default ResultsPage;