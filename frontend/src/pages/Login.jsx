import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath = location.state?.from?.pathname || "/";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const loginResult = onLogin(username, password);

    if (loginResult.success) {
      navigate(redirectPath, { replace: true });
      return;
    }

    setError(loginResult.message || "Unable to login.");
    setIsSubmitting(false);
  };

  return (
    <section className="login-shell">
      <article className="login-card glass-card">
        <header className="login-header">
          <p className="eyebrow">Loyalty Tracker</p>
          <h2 className="login-title">Login</h2>
          <p className="login-subtitle">Sign in to continue to the CRM dashboard.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        {error && <p className="status-text status-error">{error}</p>}
      </article>
    </section>
  );
}

export default Login;
