import { useNavigate } from "react-router-dom";
import { previousInterviews } from "../lib/mockData";

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function OldInterviewsPage() {
  const navigate = useNavigate();

  return (
    <section className="page">
      <div className="card">
        <h1>Old Interviews</h1>
        <p>Review your previous interview attempts, scores, and feedback.</p>
      </div>

      <div className="stack">
        {previousInterviews.map((interview) => (
          <article className="card" key={interview.id}>
            <p>
              <strong>{interview.role}</strong> on {formatDate(interview.date)}
            </p>
            <p className="score">Score: {interview.score}/100</p>
            <p>{interview.feedback}</p>
          </article>
        ))}
      </div>

      <div>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => navigate("/interview/setup")}
        >
          Back to New Interview
        </button>
      </div>
    </section>
  );
}

export default OldInterviewsPage;
