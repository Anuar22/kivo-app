import { useState, useRef, useEffect } from "react";
import { useAccount } from "../context/AccountContext.jsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function Field({ label, ...props }) {
  return (
    <div className="av2-field">
      <label className="av2-label">{label}</label>
      <input className="av2-input" {...props} />
    </div>
  );
}

// ── 6-digit code input ────────────────────────────────────────────────────────
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
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
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
    try { await onResend(); setSeconds(30); } finally { setSending(false); }
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

// ── Google "G" icon (official 4-color mark, inline SVG) ───────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 009 18z"/>
      <path fill="#FBBC05" d="M3.97 10.71A5.4 5.4 0 013.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 00.96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  );
}

// ── Google Identity Services button ───────────────────────────────────────────
// Loads Google's script once, renders the real Google button into a hidden
// container, then we trigger it via our own styled button (so it matches
// our design instead of Google's default look).
function useGoogleAuth(onCredential) {
  const hiddenBtnRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let mounted = true;

    function init() {
      if (!mounted || !window.google?.accounts?.id || !hiddenBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      });
      // Render Google's real button into our hidden container — we click it
      // programmatically from our own styled button so the UI stays consistent.
      window.google.accounts.id.renderButton(hiddenBtnRef.current, {
        type: "standard", theme: "outline", size: "large", width: 320,
      });
      setReady(true);
    }

    if (window.google?.accounts?.id) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    }

    return () => { mounted = false; };
  }, [onCredential]);

  const trigger = () => {
    // Click the real (hidden) Google button to open the official popup/flow
    hiddenBtnRef.current?.querySelector('div[role="button"]')?.click();
  };

  return { hiddenBtnRef, ready, trigger };
}

function GoogleButton({ onCredential, label, disabled }) {
  const { hiddenBtnRef, ready, trigger } = useGoogleAuth(onCredential);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <>
      {/* Real Google button, rendered off-screen — we proxy clicks to it */}
      <div ref={hiddenBtnRef} style={{ position: "absolute", opacity: 0, pointerEvents: "none", top: -9999 }} />
      <button
        type="button"
        className="av2-google-btn"
        onClick={trigger}
        disabled={!ready || disabled}
      >
        <GoogleIcon />
        {label}
      </button>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════════════════
export default function AuthScreen() {
  const { login, register, loginWithGoogle, verifyEmail, resendCode, forgotPassword, resetPassword } = useAccount();

  // view: "landing" | "login" | "register" | "verify" | "forgot" | "reset"
  const [view, setView] = useState("landing");
  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", businessName: "" });
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const goTo = (v) => { setView(v); setError(""); setInfo(""); };

  const submit = async (event) => {
    event.preventDefault();
    setError(""); setInfo(""); setLoading(true);
    try {
      if (view === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        const data = await register({ ...form, role });
        setPendingEmail(data.email || form.email);
        setView("verify");
      }
    } catch (err) {
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

  const handleGoogleCredential = async (credential) => {
    setError(""); setLoading(true);
    try {
      await loginWithGoogle(credential, role, form.businessName);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitVerify = async (event) => {
    event.preventDefault();
    if (code.length !== 6) { setError("Enter the full 6-digit code."); return; }
    setError(""); setLoading(true);
    try {
      await verifyEmail(pendingEmail, code);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async (event) => {
    event.preventDefault();
    setError(""); setInfo(""); setLoading(true);
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
    setError(""); setLoading(true);
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

  const BackLink = ({ to, label = "Back" }) => (
    <button type="button" className="av2-back" onClick={() => goTo(to)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      {label}
    </button>
  );

  // ── OTP verification ──────────────────────────────────────────────────────
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
          <BackLink to="login" label="Back to sign in" />
          <form className="av2-form" onSubmit={submitForgot}>
            <Field
              label="Email address" type="email" value={form.email}
              onChange={e => update("email", e.target.value)}
              placeholder="you@example.com" autoComplete="email"
            />
            {error && <p className="av2-error">{error}</p>}
            <button className="av2-submit" disabled={loading}>
              {loading ? "Sending…" : "Send Reset Code"}
            </button>
          </form>
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
              label="New password" type="password" value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••" autoComplete="new-password"
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

  // ── Login screen (separate, dedicated) ─────────────────────────────────────
  if (view === "login") {
    return (
      <div className="auth-v2">
        <div className="av2-header">
          <div className="av2-logo">Kivo</div>
          <p className="av2-tagline">Welcome back! Sign in to continue</p>
        </div>
        <div className="av2-card">
          <BackLink to="landing" label="Back" />

          <GoogleButton onCredential={handleGoogleCredential} label="Continue with Google" disabled={loading} />

          {GOOGLE_CLIENT_ID && (
            <div className="av2-divider">or sign in with email</div>
          )}

          <form className="av2-form" onSubmit={submit}>
            <Field
              label="Email address" type="email" value={form.email}
              onChange={e => update("email", e.target.value)}
              placeholder="you@example.com" autoComplete="email"
            />
            <Field
              label="Password" type="password" value={form.password}
              onChange={e => update("password", e.target.value)}
              placeholder="••••••••" autoComplete="current-password"
            />
            <button
              type="button" className="av2-hint-link"
              style={{ alignSelf: "flex-end", marginTop: -6 }}
              onClick={() => goTo("forgot")}
            >
              Forgot password?
            </button>

            {error && <p className="av2-error">{error}</p>}

            <button className="av2-submit" disabled={loading}>
              {loading ? "Working…" : "Sign In"}
            </button>
          </form>

          <p className="av2-hint">
            Don't have an account?{" "}
            <button type="button" className="av2-hint-link" onClick={() => goTo("register")}>
              Create one
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Register screen (separate, dedicated) ──────────────────────────────────
  if (view === "register") {
    return (
      <div className="auth-v2">
        <div className="av2-header">
          <div className="av2-logo">Kivo</div>
          <p className="av2-tagline">One account for ordering and selling food</p>
        </div>
        <div className="av2-card">
          <BackLink to="landing" label="Back" />

          <div className="av2-role-choice">
            <button type="button" className={`av2-role-btn ${role === "customer" ? "active" : ""}`} onClick={() => setRole("customer")}>
              <span className="av2-role-icon">👤</span><span>Customer</span>
            </button>
            <button type="button" className={`av2-role-btn ${role === "vendor" ? "active" : ""}`} onClick={() => setRole("vendor")}>
              <span className="av2-role-icon">🏪</span><span>Vendor</span>
            </button>
          </div>

          {role === "vendor" && (
            <Field
              label="Restaurant / shop name" value={form.businessName}
              onChange={e => update("businessName", e.target.value)}
              placeholder="e.g. Mama's Kitchen"
              style={{ marginBottom: 14 }}
            />
          )}

          <GoogleButton
            onCredential={handleGoogleCredential}
            label={`Continue with Google${role === "vendor" ? " as Vendor" : ""}`}
            disabled={loading || (role === "vendor" && !form.businessName.trim())}
          />
          {role === "vendor" && !form.businessName.trim() && GOOGLE_CLIENT_ID && (
            <p style={{ fontSize: 11, color: "var(--on-surface-faint)", textAlign: "center", marginTop: 6 }}>
              Enter your shop name above to continue with Google
            </p>
          )}

          {GOOGLE_CLIENT_ID && (
            <div className="av2-divider">or sign up with email</div>
          )}

          <form className="av2-form" onSubmit={submit}>
            <Field
              label="Full name" value={form.name}
              onChange={e => update("name", e.target.value)}
              placeholder="Your full name" autoComplete="name"
            />
            <Field
              label="Phone number" value={form.phone}
              onChange={e => update("phone", e.target.value)}
              placeholder="+255 7xx xxx xxx" autoComplete="tel"
            />
            <Field
              label="Email address" type="email" value={form.email}
              onChange={e => update("email", e.target.value)}
              placeholder="you@example.com" autoComplete="email"
            />
            <Field
              label="Password" type="password" value={form.password}
              onChange={e => update("password", e.target.value)}
              placeholder="••••••••" autoComplete="new-password"
            />

            {error && <p className="av2-error">{error}</p>}

            <button className="av2-submit" disabled={loading}>
              {loading ? "Working…" : `Create ${role === "vendor" ? "Vendor" : "Customer"} Account`}
            </button>
          </form>

          <p className="av2-hint">
            Already have an account?{" "}
            <button type="button" className="av2-hint-link" onClick={() => goTo("login")}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Landing — choose login or register ──────────────────────────────────────
  return (
    <div className="auth-v2" style={{ backgroundColor: "#dc2626", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="av2-header" style={{ padding: "72px 0 36px" }}>
        {/* Logo container using your specific icon path */}
        <div className="av2-logo" style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <img src="/icons/red-screen.png" alt="Kivo Logo" style={{ height: 50, width: "auto" }} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: "auto", paddingBottom: 24 }}>
        <button 
          className="av2-submit" 
          style={{ background: "#ffffff", color: "#dc2626", fontWeight: "600" }} 
          onClick={() => goTo("register")}
        >
          Create an account
        </button>
        
        <button
          className="av2-google-btn"
          style={{ background: "#ffffff", color: "#dc2626", fontWeight: "600" }}
          onClick={() => goTo("login")}
        >
          I already have an account
        </button>
      </div>
    </div>
  );
}
