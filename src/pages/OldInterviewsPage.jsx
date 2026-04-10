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
        <h1>Previous Interviews</h1>
        <p>Review past interview setups, scores, and feedback.</p>
      </div>

      <div className="stack">
        {previousInterviews.map((interview) => (
          <article className="card" key={interview.id}>
            <p>
              <strong>{interview.interviewName}</strong> on{" "}
              {formatDate(interview.date)}
            </p>
            <p>
              {interview.company} · {interview.difficulty} ·{" "}
              {interview.durationMinutes} minutes
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
