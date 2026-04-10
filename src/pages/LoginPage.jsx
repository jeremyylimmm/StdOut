import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";

function LoginPage() {
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const { login } = useAppState();

  const handleSubmit = (event) => {
    event.preventDefault();
    login(name);
    navigate("/dashboard");
  };

  return (
    <section className="page narrow">
      <div className="card">
        <h1>Login</h1>
        <p>Use a mock login to enter the interview simulator.</p>
        <form onSubmit={handleSubmit} className="stack">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Alex Candidate"
          />
          <button type="submit">Continue</button>
        </form>
      </div>
    </section>
  );
}

export default LoginPage;
