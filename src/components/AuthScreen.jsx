import { useState, useRef, useEffect } from "react";
import { useAccount } from "../context/AccountContext.jsx";

function Field({ label, ...props }) {
  return (
    <div className="av2-field">
      <label className="av2-label">{label}</label>
      <input className="av2-input" {...props} />
    </div>
  );
}

// ── 6-digit code input: six boxes that behave like one field ────────────────
function CodeInput({ value, onChange }) {
  const refs = useRef([]);
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  const setDigit = (i, d) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join(""));
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      e.preventDefault();
      onChange(pasted.padEnd(6, "").slice(0, 6).replace(/\s/g, ""));
      refs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "8px 0 4px" }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => (refs.current[i] = el)}
          value={d}
          onChange={e => setDigit(i, e.target.value.replace(/\D/g, "").slice(-1))}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          inputMode="numeric"
          maxLength={1}
          style={{
            width: 42, height: 52, textAlign: "center", fontSize: 22, fontWeight: 700,
            borderRadius: 12, border: "1.5px solid var(--line)", background: "var(--surface-alt)",
            color: "var(--on-surface)", outline: "none", fontFamily: "'Syne', sans-serif",
          }}
        />
      ))}
    </div>
  );
}

function ResendTimer({ onResend }) {
  const [seconds, setSeconds] = useState(30);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const handleResend = async () => {
    setSending(true);
    try {
      await onResend();
      setSeconds(30);
    } finally {
      setSending(false);
    }
  };

  return (
    <p className="av2-hint">
      Didn't get a code?{" "}
      {seconds > 0 ? (
        <span style={{ color: "var(--on-surface-faint)" }}>Resend in {seconds}s</span>
      ) : (
        <button type="button" className="av2-hint-link" onClick={handleResend} disabled={sending}>
          {sending ? "Sending…" : "Resend code"}
        </button>
      )}
    </p>
  );
}

export default function AuthScreen() {
  const { login, register, verifyEmail, resendCode, forgotPassword, resetPassword } = useAccount();

  // view: "register" | "login" | "verify" | "forgot" | "reset"
  const [view, setView] = useState("register");
  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", businessName: "" });
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (view === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        const data = await register({ ...form, role });
        setPendingEmail(data.email || form.email);
        setView("verify");
      }
    } catch (err) {
      // Login blocked because the account isn't verified yet — route them to the OTP screen
      if (err.data?.pendingVerification) {
        setPendingEmail(err.data.email || form.email);
        setView("verify");
        setError("");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitVerify = async (event) => {
    event.preventDefault();
    if (code.length !== 6) { setError("Enter the full 6-digit code."); return; }
    setError("");
    setLoading(true);
    try {
      await verifyEmail(pendingEmail, code);
      // AccountContext sets the user on success — KivoApp will switch views automatically
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await forgotPassword(form.email);
      setPendingEmail(form.email);
      setInfo("If that email is registered, a reset code is on its way.");
      setView("reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event) => {
    event.preventDefault();
    if (code.length !== 6) { setError("Enter the full 6-digit code."); return; }
    if (newPassword.length < 6) { setError("New password must be at least 6 characters."); return; }
    setError("");
    setLoading(true);
    try {
      await resetPassword(pendingEmail, code, newPassword);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerify = () => resendCode(pendingEmail, "verify_email");
  const handleResendReset  = () => resendCode(pendingEmail, "reset_password");

  // ── OTP verification screen ───────────────────────────────────────────────
  if (view === "verify") {
    return (
      <div className="auth-v2">
        <div className="av2-header">
          <div className="av2-logo">Kivo</div>
          <p className="av2-tagline">Check your email</p>
        </div>
        <div className="av2-card">
          <p style={{ fontSize: 13, color: "var(--on-surface-muted)", textAlign: "center", lineHeight: 1.6, marginBottom: 4 }}>
            We sent a 6-digit code to<br /><strong style={{ color: "var(--on-surface)" }}>{pendingEmail}</strong>
          </p>
          <form className="av2-form" onSubmit={submitVerify}>
            <CodeInput value={code} onChange={setCode} />
            {error && <p className="av2-error">{error}</p>}
            <button className="av2-submit" disabled={loading}>
              {loading ? "Verifying…" : "Verify & Continue"}
            </button>
          </form>
          <ResendTimer onResend={handleResendVerify} />
          <p className="av2-hint">
            <button type="button" className="av2-hint-link" onClick={() => { setView("register"); setCode(""); setError(""); }}>
              ← Back
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Forgot password: request code ─────────────────────────────────────────
  if (view === "forgot") {
    return (
      <div className="auth-v2">
        <div className="av2-header">
          <div className="av2-logo">Kivo</div>
          <p className="av2-tagline">Reset your password</p>
        </div>
        <div className="av2-card">
          <form className="av2-form" onSubmit={submitForgot}>
            <Field
              label="Email address"
              type="email"
              value={form.email}
              onChange={e => update("email", e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {error && <p className="av2-error">{error}</p>}
            <button className="av2-submit" disabled={loading}>
              {loading ? "Sending…" : "Send Reset Code"}
            </button>
          </form>
          <p className="av2-hint">
            <button type="button" className="av2-hint-link" onClick={() => { setView("login"); setError(""); }}>
              ← Back to sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Forgot password: enter code + new password ────────────────────────────
  if (view === "reset") {
    return (
      <div className="auth-v2">
        <div className="av2-header">
          <div className="av2-logo">Kivo</div>
          <p className="av2-tagline">Enter your reset code</p>
        </div>
        <div className="av2-card">
          {info && <p style={{ fontSize: 13, color: "var(--on-surface-muted)", textAlign: "center", marginBottom: 8 }}>{info}</p>}
          <form className="av2-form" onSubmit={submitReset}>
            <CodeInput value={code} onChange={setCode} />
            <Field
              label="New password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            {error && <p className="av2-error">{error}</p>}
            <button className="av2-submit" disabled={loading}>
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </form>
          <ResendTimer onResend={handleResendReset} />
          <p className="av2-hint">
            <button type="button" className="av2-hint-link" onClick={() => { setView("login"); setCode(""); setError(""); }}>
              ← Back to sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Register / Login ───────────────────────────────────────────────────────
  return (
    <div className="auth-v2">
      <div className="av2-header">
        <div className="av2-logo">Kivo</div>
        <p className="av2-tagline">
          {view === "login" ? "Welcome back! Sign in to continue" : "One account for ordering and selling food"}
        </p>
      </div>

      <div className="av2-card">
        <div className="av2-tabs">
          <button className={`av2-tab ${view === "register" ? "active" : ""}`} onClick={() => { setView("register"); setError(""); }}>
            Create account
          </button>
          <button className={`av2-tab ${view === "login" ? "active" : ""}`} onClick={() => { setView("login"); setError(""); }}>
            Sign in
          </button>
        </div>

        <form className="av2-form" onSubmit={submit}>
          {view === "register" && (
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
                placeholder="+255 7xx xxx xxx"
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
            autoComplete={view === "login" ? "current-password" : "new-password"}
          />

          {view === "login" && (
            <button
              type="button"
              className="av2-hint-link"
              style={{ alignSelf: "flex-end", marginTop: -6 }}
              onClick={() => { setView("forgot"); setError(""); }}
            >
              Forgot password?
            </button>
          )}

          {error && <p className="av2-error">{error}</p>}

          <button className="av2-submit" disabled={loading}>
            {loading ? "Working…" : view === "login" ? "Sign In" : `Create ${role === "vendor" ? "Vendor" : "Customer"} Account`}
          </button>
        </form>

        <p className="av2-hint">
          {view === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            className="av2-hint-link"
            onClick={() => { setView(view === "login" ? "register" : "login"); setError(""); }}
          >
            {view === "login" ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
