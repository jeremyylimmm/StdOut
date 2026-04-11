import { useLocation, useNavigate } from "react-router-dom";
import ResultsCard from "../components/ResultsCard";
import { useAppState } from "../lib/AppStateContext";

function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, settings, resetInterview } = useAppState();

  const timeSpentSeconds = location.state?.timeSpentSeconds ?? 0;
  const codeLength = location.state?.codeLength ?? 0;
  const testResults = location.state?.testResults;

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
      <button type="button" onClick={handleTryAgain}>
        Start New Interview
      </button>
    </section>
  );
}

export default ResultsPage;
