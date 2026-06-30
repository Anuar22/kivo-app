import { useState, useEffect } from "react";
import { useAccount } from "../context/AccountContext.jsx";
import { usersApi } from "../api/index.js";

export default function Profile({ navigate }) {
  const { user, updateUserLocal } = useAccount();
  const [editing, setEditing] = useState(false);
  
  // Profile Data States
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");

  // Payment Setup States
  const [savedPhone, setSavedPhone] = useState(user?.savedPaymentPhone || "");
  const [cardStatus, setCardStatus] = useState(user?.hasSavedCard ? "Linked" : "No card linked");
  const [loadingPayment, setLoadingPayment] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
      setSavedPhone(user.savedPaymentPhone || "");
      setCardStatus(user.hasSavedCard ? "Linked" : "No card linked");
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      // Push changes directly to Render backend
      const res = await usersApi.updateProfile({ name, phone, email });
      updateUserLocal(res.user);
      setEditing(false);
      setMessage({ text: "Profile updated successfully! ✨", type: "success" });
    } catch (err) {
      setMessage({ text: err.message || "Failed to update profile.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const saveMobileMoneyDetails = async () => {
    if (!savedPhone.trim()) {
      setMessage({ text: "Please enter a valid phone number.", type: "error" });
      return;
    }
    setLoadingPayment(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await usersApi.updatePaymentSettings({ savedPaymentPhone: savedPhone });
      updateUserLocal(res.user);
      setMessage({ text: "Default mobile money number updated! 📱", type: "success" });
    } catch (err) {
      setMessage({ text: "Failed to update payment settings.", type: "error" });
    } finally {
      setLoadingPayment(false);
    }
  };

  const simulatedLinkCard = () => {
    setLoadingPayment(true);
    setMessage({ text: "", type: "" });
    // Simulate linking securely via Stripe flow tokenization
    setTimeout(async () => {
      try {
        const res = await usersApi.updatePaymentSettings({ hasSavedCard: true });
        updateUserLocal(res.user);
        setCardStatus("Linked");
        setMessage({ text: "Card linked securely via Stripe! 💳", type: "success" });
      } catch (err) {
        setMessage({ text: "Failed to link card.", type: "error" });
      } finally {
        setLoadingPayment(false);
      }
    }, 1200);
  };

  return (
    <div className="profile-container" style={{ fontFamily: "DM Sans, sans-serif", background: "#fafaf9", minHeight: "100vh", paddingBottom: 100 }}>
      
      {/* Red Header Top Part - Made Well Visible */}
      <div style={{ background: "#e53935", padding: "40px 24px 30px", borderBottomLeftRadius: 24, borderBottomRightRadius: 24, color: "white", boxShadow: "0 4px 15px rgba(229, 57, 53, 0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, border: "2px solid white" }}>
            {name ? name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{name || "Welcome Back!"}</h2>
            <p style={{ margin: "4px 0 0", opacity: 0.9, fontSize: 13 }}>{email || "Customer Account"}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px", marginTop: 24 }}>
        {message.text && (
          <div style={{ padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13, background: message.type === "success" ? "#dcfce7" : "#fee2e2", color: message.type === "success" ? "#166534" : "#991b1b", border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fca5a5"}` }}>
            {message.text}
          </div>
        )}

        {/* Account Details Block */}
        <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 20, border: "1px solid #e8e4df" }}>
          <div style={{ display: "flex", justifyContent: "between", alignItems: "center", marginBottom: 16, width: "100%" }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f0f0f" }}>Personal Information</h3>
            {!editing && (
              <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", color: "#e53935", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "DM Sans" }}>Edit</button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#7a7065", display: "block", marginBottom: 4 }}>Full Name</label>
                <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e8e4df" }} required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#7a7065", display: "block", marginBottom: 4 }}>Phone Number</label>
                <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e8e4df" }} required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#7a7065", display: "block", marginBottom: 4 }}>Email Address</label>
                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e8e4df" }} required />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="submit" disabled={loading} style={{ flex: 1, background: "#e53935", color: "white", border: "none", padding: "10px", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditing(false)} style={{ background: "none", border: "1.5px solid #e8e4df", padding: "10px 16px", borderRadius: 10, fontSize: 13, color: "#7a7065", cursor: "pointer" }}>Cancel</button>
              </div>
            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#7a7065" }}>Name</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f0f0f" }}>{user?.name || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#7a7065" }}>Phone</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f0f0f" }}>{user?.phone || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#7a7065" }}>Email</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f0f0f" }}>{user?.email || "—"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Payment Details Section - Active Mode */}
        <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #e8e4df" }}>
          <h3 style={{ margin: "0 0 4px 0", fontSize: 15, fontWeight: 700, color: "#0f0f0f" }}>Payment Setup</h3>
          <p style={{ margin: "0 0 16px 0", fontSize: 12, color: "#7a7065" }}>Speed up checkouts by configuring your default platforms here.</p>

          {/* Mobile Money configuration */}
          <div style={{ borderBottom: "1px solid #f0ede9", paddingBottom: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>📱</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0f0f0f" }}>Mobile Money Number</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input 
                type="tel" 
                placeholder="e.g., 0712345678" 
                value={savedPhone} 
                onChange={e => setSavedPhone(e.target.value)}
                style={{ flex: 1, padding: "10px 12px", fontSize: 13, borderRadius: 10, border: "1.5px solid #e8e4df", fontFamily: "DM Sans" }}
              />
              <button 
                onClick={saveMobileMoneyDetails} 
                disabled={loadingPayment}
                style={{ background: "#0f0f0f", color: "white", border: "none", borderRadius: 10, padding: "0 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Save
              </button>
            </div>
          </div>

          {/* Card Management Link Block via secure token logic */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>💳</span>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0f0f0f", display: "block" }}>Credit / Debit Card</span>
                  <span style={{ fontSize: 11, color: cardStatus === "Linked" ? "#16a34a" : "#7a7065", fontWeight: cardStatus === "Linked" ? 600 : 400 }}>{cardStatus}</span>
                </div>
              </div>
              <button 
                onClick={simulatedLinkCard}
                disabled={loadingPayment || cardStatus === "Linked"}
                style={{ background: cardStatus === "Linked" ? "#f7f5f2" : "#e53935", color: cardStatus === "Linked" ? "#b0a89f" : "white", border: "none", padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: cardStatus === "Linked" ? "not-allowed" : "pointer", fontFamily: "DM Sans" }}
              >
                {cardStatus === "Linked" ? "Saved" : "Link Card"}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}