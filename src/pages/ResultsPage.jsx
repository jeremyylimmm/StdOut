import { useLocation, useNavigate } from "react-router-dom";
import ResultsCard from "../components/ResultsCard";
import { useAppState } from "../lib/AppStateContext";

function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, settings, resetInterview } = useAppState();

  const questionsAttempted = location.state?.questionsAttempted ?? 1;
  const codeLength = location.state?.codeLength ?? 0;

  const handleTryAgain = () => {
    resetInterview();
    navigate("/dashboard");
  };

  return (
    <section className="page narrow">
      <ResultsCard
        user={user}
        settings={settings}
        questionsAttempted={questionsAttempted}
        codeLength={codeLength}
      />
      <button type="button" onClick={handleTryAgain}>
        Back to Dashboard
      </button>
    </section>
  );
}

export default ResultsPage;
