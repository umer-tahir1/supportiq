import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { Brand } from "../components/Common";
import { loginAdmin } from "../services/api";

export default function AdminLogin() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      await loginAdmin(Object.fromEntries(new FormData(event.currentTarget)));
      navigate("/admin", { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="login-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        Back to customer care
      </Link>
      <div className="login-card">
        <Brand admin />
        <div className="login-title">
          <span className="form-icon">
            <LockKeyhole size={20} />
          </span>
          <h1>Welcome to your workspace.</h1>
          <p>Sign in to understand what your customers are telling you.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Work email
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="admin@example.com"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={256}
              placeholder="Enter your password"
            />
          </label>
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          <button className="button primary" disabled={pending}>
            {pending ? "Signing in…" : "Sign in to SupportIQ"}
            <ArrowRight size={17} />
          </button>
        </form>
        <div className="login-footnote">
          <LockKeyhole size={13} />
          Restricted to authorized UrbanBite administrators.
        </div>
      </div>
      <p className="login-caption">
        A clearer picture. A better customer experience.
      </p>
    </div>
  );
}
