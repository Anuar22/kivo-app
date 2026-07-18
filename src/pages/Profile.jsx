import { useState, useEffect } from "react";
import { useAccount } from "../context/AccountContext.jsx";
import { apiRequest } from "../api/index.js";
import SuccessModal from "../components/SuccessModal.jsx";
import { fmt } from "../utils/currency.js";

// ── PERMANENTLY DARK STATEFUL FIELD COMPONENT ────────────────────────────────
function Field({ label, value, onChange, type = "text", placeholder, disabled }) {
  return (
    <div style={{ position: "relative", marginBottom: "20px" }}>
      <label style={{
        position: "absolute", 
        left: "14px", 
        top: "-8px", 
        background: "#000000", 
        padding: "0 6px",
        fontSize: "11px", 
        fontWeight: "700", 
        color: "#e53935", 
        zIndex: 2, 
        pointerEvents: "none",
        letterSpacing: "0.3px"
      }}>
        {label}
      </label>
      <input
        style={{
          width: "100%", 
          height: "50px", 
          border: "1px solid #222222", 
          borderRadius: "14px",
          padding: "0 16px", 
          fontSize: "14px", 
          fontWeight: "600",
          color: disabled ? "#666666" : "#ffffff",
          background: disabled ? "#0a0a0a" : "#121212",
          outline: "none", 
          boxSizing: "border-box"
        }}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

// ── PERMANENTLY DARK LIST ROW ENTRY ──────────────────────────────────────────
function ListRow({ icon, label, onClick, badge, rightElement }) {
  return (
    <div 
      style={{
        width: "100%", 
        display: "flex", 
        alignItems: "center", 
        padding: "14px 0", 
        borderBottom: "1px solid #1a1a1a"
      }}
    >
      <span style={{ marginRight: "12px", fontSize: "16px" }}>{icon}</span>
      <span style={{ 
        flex: 1, 
        textAlign: "left", 
        fontSize: "14px", 
        fontWeight: "600", 
        color: "#ffffff" 
      }}>{label}</span>
      {badge && (
        <span style={{ fontSize: "11px", background: "rgba(229, 57, 53, 0.15)", color: "#e53935", padding: "2px 8px", borderRadius: "8px", marginRight: "8px", fontWeight: "700" }}>
          {badge}
        </span>
      )}
      {rightElement ? rightElement : (
        <button type="button" onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      )}
    </div>
  );
}

// ── MAIN PROFILE SCREEN COMPONENT ───────────────────────────────────────────
export default function Profile({ navigate }) {
  const { user, logout, updateUser } = useAccount();
  
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState(null);

  const [showPayPopup, setShowPayPopup] = useState(false);
  const [payPhone, setPayPhone] = useState(user?.savedPaymentPhone || user?.phone || "");
  const [hasSavedCard, setHasSavedCard] = useState(user?.hasSavedCard || false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    apiRequest("/api/auth/me/stats").then(setStats).catch(() => {});
  }, []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const { user: updated } = await apiRequest("/api/auth/me/update", {
        method: "PATCH",
        body: { name: form.name, phone: form.phone, address: form.address },
      });
      updateUser(updated);
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const savePaymentSettings = async (e) => {
    e.preventDefault();
    setUpdatingPayment(true);
    try {
      const { user: updated } = await apiRequest("/api/auth/me/update-payment", {
        method: "PATCH",
        body: { savedPaymentPhone: payPhone, hasSavedCard },
      });
      updateUser(updated);
      setShowPayPopup(false);
    } catch (e) {
      alert(e.message || "Failed to update wallet parameters.");
    } finally {
      setUpdatingPayment(false);
    }
  };

  return (
    <div 
      className="page profile-page" 
      style={{
        background: "#000000",
        backgroundColor: "#000000",
        minHeight: "100vh",
        /* 🛠️ THE FIX: Pulls page up over the empty navigation bar spacer area */
        marginTop: "calc(-1 * (var(--nav-h) + var(--sat)))", 
        padding: 0,
        paddingTop: "calc(var(--sat) + 12px)",
        fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
        boxSizing: "border-box"
      }}
    >
      {/* Top Header Row — Perfectly flush with phone top bar */}
      <div style={{
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        padding: "12px 20px 10px 20px",
        background: "#000000",
        borderBottom: "1px solid #141414",
      }}>
        <button onClick={() => navigate("home")} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#ffffff", fontFamily: "var(--font-heading)" }}>
          Profile
        </h2>
        <div style={{ width: "22px" }} />
      </div>

      {/* Content Body Container Layout */}
      <div style={{ maxWidth: "420px", margin: "0 auto", padding: "20px 16px" }}>
        
        {/* Profile Summary Header Card */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", padding: "4px" }}>
          <div style={{ 
            width: "56px", 
            height: "56px", 
            borderRadius: "50%", 
            background: "rgba(229, 57, 53, 0.12)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            fontSize: "20px", 
            fontWeight: "800", 
            color: "#e53935",
            border: "1px solid rgba(229, 57, 53, 0.2)"
          }}>
            {form.name ? form.name[0].toUpperCase() : "👤"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {form.name || "User Account"}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#a0a0a0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {form.email}
            </p>
          </div>
        </div>

        {/* Dark Metrics Grid Segment */}
        {stats && (
          <div style={{ 
            display: "flex", 
            justifyContent: "space-around", 
            background: "#121212", 
            padding: "14px 4px", 
            borderRadius: "16px", 
            marginBottom: "24px",
            border: "1px solid #1a1a1a",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
          }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <span style={{ display: "block", fontSize: "15px", fontWeight: "800", color: "#ffffff" }}>{stats.completedOrders}</span>
              <span style={{ fontSize: "11px", color: "#666666", marginTop: "2px", display: "block" }}>Orders</span>
            </div>
            <div style={{ width: "1px", background: "#222222" }} />
            <div style={{ textAlign: "center", flex: 1 }}>
              <span style={{ display: "block", fontSize: "15px", fontWeight: "800", color: "#e53935" }}>{fmt(stats.totalSpent)}</span>
              <span style={{ fontSize: "11px", color: "#666666", marginTop: "2px", display: "block" }}>Spent</span>
            </div>
            <div style={{ width: "1px", background: "#222222" }} />
            <div style={{ textAlign: "center", flex: 1 }}>
              <span style={{ display: "block", fontSize: "15px", fontWeight: "800", color: "#16a34a" }}>{stats.activeOrders}</span>
              <span style={{ fontSize: "11px", color: "#666666", marginTop: "2px", display: "block" }}>Active</span>
            </div>
          </div>
        )}

        {/* Input Fields Panel */}
        <div style={{ marginBottom: "24px" }}>
          <Field label="Name" value={form.name} onChange={set("name")} placeholder="Full Name" />
          <Field label="Delivery address" value={form.address} onChange={set("address")} placeholder="Address Line" />
          <Field label="Phone number" value={form.phone} onChange={set("phone")} placeholder="Phone number" />
          {error && <p style={{ fontSize: "13px", color: "#ef4444", marginTop: "-10px", marginBottom: "16px", fontWeight: 600 }}>{error}</p>}
        </div>

        {/* Action Options Panel (Dark mode option removed) */}
        <div style={{ 
          background: "#121212", 
          borderRadius: "16px", 
          padding: "6px 16px", 
          border: "1px solid #1a1a1a",
          marginBottom: "30px"
        }}>
          <ListRow 
            icon="💳" 
            label="Payment Details" 
            onClick={() => setShowPayPopup(true)} 
            badge={hasSavedCard ? "Active" : null} 
          />
          <ListRow icon="🧾" label="Order history" onClick={() => navigate("orders")} />
        </div>

        {/* Main Action Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button 
            type="button" onClick={save} disabled={saving}
            style={{ 
              flex: 1.3, 
              height: "50px", 
              background: "#e53935", 
              color: "#ffffff", 
              border: "none", 
              borderRadius: "14px", 
              fontWeight: "700", 
              fontSize: "14px", 
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(229,57,53,0.3)"
            }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button 
            type="button" onClick={logout}
            style={{ 
              flex: 1, 
              height: "50px", 
              background: "transparent", 
              color: "#ef4444", 
              border: "2px solid rgba(239, 68, 68, 0.2)", 
              borderRadius: "14px", 
              fontWeight: "700", 
              fontSize: "14px", 
              cursor: "pointer"
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {/* ── HIGH OVERLAY POPUP FORM MODAL ── */}
      {showPayPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px", backdropFilter: "blur(4px)" }}>
          <form onSubmit={savePaymentSettings} style={{ 
            background: "#121212", 
            border: "1px solid #222222",
            width: "100%", 
            maxWidth: "360px", 
            borderRadius: "20px", 
            padding: "24px", 
            boxShadow: "0 12px 40px rgba(0,0,0,0.6)", 
            boxSizing: "border-box" 
          }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "#ffffff", fontFamily: "var(--font-heading)" }}>Payment Details</h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "12px", color: "#a0a0a0", lineHeight: 1.4 }}>Set standard parameters for checkout operations.</p>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#e53935", marginBottom: "6px" }}>Default Mobile Money Number</label>
              <input 
                type="tel" 
                style={{ 
                  width: "100%", 
                  height: "44px", 
                  border: "1px solid #222222", 
                  borderRadius: "12px", 
                  padding: "0 12px", 
                  fontSize: "13px", 
                  boxSizing: "border-box", 
                  outline: "none",
                  background: "#000000",
                  color: "#ffffff"
                }}
                value={payPhone} 
                onChange={e => setPayPhone(e.target.value)} 
                placeholder="e.g. 0712345678" 
              />
            </div>

            <div style={{ 
              background: "#0a0a0a", 
              borderRadius: "12px", 
              padding: "12px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              marginBottom: "24px", 
              border: "1px solid #222222" 
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "16px" }}>💳</span>
                <div>
                  <span style={{ fontSize: "13px", fontWeight: "700", display: "block", color: "#ffffff" }}>Credit / Debit Card</span>
                  <span style={{ fontSize: "11px", color: hasSavedCard ? "#16a34a" : "#666666", fontWeight: "600" }}>{hasSavedCard ? "Token linked securely" : "No saved cards"}</span>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={hasSavedCard} 
                onChange={e => setHasSavedCard(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#e53935", cursor: "pointer" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" disabled={updatingPayment} style={{ flex: 1.2, height: "42px", background: "#e53935", color: "#ffffff", border: "none", borderRadius: "12px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                {updatingPayment ? "Saving…" : "Save Wallet"}
              </button>
              <button type="button" onClick={() => setShowPayPopup(false)} style={{ flex: 1, height: "42px", background: "none", border: "1px solid #222222", borderRadius: "12px", fontSize: "13px", color: "#a0a0a0", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {success && (
        <SuccessModal
          title="Updated"
          message="Your profile has been updated successfully."
          buttonLabel="OK"
          onClose={() => setSuccess(false)}
        />
      )}
    </div>
  );
}