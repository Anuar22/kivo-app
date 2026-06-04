import { useState } from "react";
import { useAccount } from "../context/useAccount.js";

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
    <div className="auth-screen">
      <div className="auth-brand">
        <div className="auth-logo"><span>K</span>ivo</div>
        <p>One account for food delivery, restaurant orders, and vendor operations.</p>
      </div>

      <div className="auth-panel">
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>Create account</button>
          <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>Sign in</button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
            <>
              <div className="role-choice">
                <button type="button" className={role === "customer" ? "active" : ""} onClick={() => setRole("customer")}>👤 Customer</button>
                <button type="button" className={role === "vendor" ? "active" : ""} onClick={() => setRole("vendor")}>🏪 Vendor</button>
              </div>
              <input className="auth-input" value={form.name} onChange={e => update("name", e.target.value)} placeholder="Full name" autoComplete="name" />
              <input className="auth-input" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="Phone number" autoComplete="tel" />
              {role === "vendor" && (
                <input className="auth-input" value={form.businessName} onChange={e => update("businessName", e.target.value)} placeholder="Restaurant or shop name" />
              )}
            </>
          )}

          <input className="auth-input" type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="Email address" autoComplete="email" />
          <input className="auth-input" type="password" value={form.password} onChange={e => update("password", e.target.value)} placeholder="Password" autoComplete={mode === "login" ? "current-password" : "new-password"} />

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit" disabled={loading}>
            {loading ? "Working..." : mode === "login" ? "Sign in" : `Create ${role} account`}
          </button>
        </form>

        <p className="auth-hint">Use a real email and phone format now. Later we can add OTP verification, permissions, and payment identity checks.</p>
      </div>
    </div>
  );
}
