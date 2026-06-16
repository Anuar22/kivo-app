import { useState } from "react";
import { useAccount } from "../context/AccountContext.jsx";

function Field({ label, ...props }) {
  return (
    <div className="av2-field">
      <label className="av2-label">{label}</label>
      <input className="av2-input" {...props} />
    </div>
  );
}

export default function AuthScreen() {
  const { login, register } = useAccount();
  const [mode, setMode] = useState("register");
  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", businessName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        await register({ ...form, role });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-v2">
      {/* ── Header ── */}
      <div className="av2-header">
        <div className="av2-logo">Kivo</div>
        <p className="av2-tagline">
          {mode === "login" ? "Welcome back! Sign in to continue" : "One account for ordering and selling food"}
        </p>
      </div>

      {/* ── Card ── */}
      <div className="av2-card">
        <div className="av2-tabs">
          <button className={`av2-tab ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>
            Create account
          </button>
          <button className={`av2-tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>
            Sign in
          </button>
        </div>

        <form className="av2-form" onSubmit={submit}>
          {mode === "register" && (
            <>
              <div className="av2-role-choice">
                <button
                  type="button"
                  className={`av2-role-btn ${role === "customer" ? "active" : ""}`}
                  onClick={() => setRole("customer")}
                >
                  <span className="av2-role-icon">👤</span>
                  <span>Customer</span>
                </button>
                <button
                  type="button"
                  className={`av2-role-btn ${role === "vendor" ? "active" : ""}`}
                  onClick={() => setRole("vendor")}
                >
                  <span className="av2-role-icon">🏪</span>
                  <span>Vendor</span>
                </button>
              </div>

              <Field
                label="Full name"
                value={form.name}
                onChange={e => update("name", e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
              />
              <Field
                label="Phone number"
                value={form.phone}
                onChange={e => update("phone", e.target.value)}
                placeholder="+254 7xx xxx xxx"
                autoComplete="tel"
              />
              {role === "vendor" && (
                <Field
                  label="Restaurant / shop name"
                  value={form.businessName}
                  onChange={e => update("businessName", e.target.value)}
                  placeholder="e.g. Mama's Kitchen"
                />
              )}
            </>
          )}

          <Field
            label="Email address"
            type="email"
            value={form.email}
            onChange={e => update("email", e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={e => update("password", e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          {error && <p className="av2-error">{error}</p>}

          <button className="av2-submit" disabled={loading}>
            {loading ? "Working…" : mode === "login" ? "Sign In" : `Create ${role === "vendor" ? "Vendor" : "Customer"} Account`}
          </button>
        </form>

        <p className="av2-hint">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            className="av2-hint-link"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
