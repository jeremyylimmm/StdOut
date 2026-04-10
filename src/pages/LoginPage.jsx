import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";

function LoginPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const googleButtonRef = useRef(null);
  const navigate = useNavigate();
  const { loginWithGoogleToken } = useAppState();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleClientId) {
      setError("Missing VITE_GOOGLE_CLIENT_ID in env.");
      return;
    }

    let attempts = 0;
    const intervalId = window.setInterval(() => {
      attempts += 1;

      if (!window.google?.accounts?.id || !googleButtonRef.current) {
        if (attempts >= 50) {
          setError("Google Sign-In script failed to load.");
          window.clearInterval(intervalId);
        }
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          try {
            setIsLoading(true);
            setError("");
            await loginWithGoogleToken(response.credential);
            navigate("/interview/setup");
          } catch (authError) {
            setError(authError.message || "Sign-in failed.");
          } finally {
            setIsLoading(false);
          }
        },
      });

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 300,
      });

      window.clearInterval(intervalId);
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [googleClientId, loginWithGoogleToken, navigate]);

  return (
    <section className="page narrow">
      <div className="card">
        <h1>Login</h1>
        <p>Sign in with Google to continue.</p>
        <div className="stack">
          <div ref={googleButtonRef} />
          {isLoading && <p>Signing you in...</p>}
          {error && <p className="mic-error">{error}</p>}
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
