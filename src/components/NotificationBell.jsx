import { useState, useEffect, useRef } from "react";
import { notificationsApi } from "../api/index.js";

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapRef = useRef(null);

  const load = () => {
    notificationsApi.list()
      .then(({ notifications, unreadCount }) => {
        setNotifications(notifications);
        setUnreadCount(unreadCount);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggleOpen = () => {
    setOpen(o => !o);
    if (!open) load();
  };

  const markRead = (n) => {
    if (n.read_at) return;
    notificationsApi.markRead(n.id).catch(() => {});
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = () => {
    notificationsApi.markAllRead().catch(() => {});
    setNotifications(prev => prev.map(x => ({ ...x, read_at: x.read_at || new Date().toISOString() })));
    setUnreadCount(0);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={toggleOpen}
        className="hv2-avatar"
        style={{ position: "relative" }}
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -2, right: -2, background: "#e53935", color: "white",
            fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
            border: "1.5px solid white",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: 44, right: 0, width: 320, maxWidth: "85vw",
          background: "white", borderRadius: 16, boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          border: "1px solid #eee", zIndex: 50, overflow: "hidden",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "#0f0f0f" }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#e53935", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#aaa" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                <p style={{ fontSize: 13 }}>Nothing yet. Follow a vendor to get updates here.</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => markRead(n)}
                  style={{
                    display: "flex", gap: 10, width: "100%", textAlign: "left", padding: "12px 14px",
                    border: "none", borderBottom: "1px solid #f5f5f5", cursor: "pointer",
                    background: n.read_at ? "white" : "#fdecea",
                  }}
                >
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{n.vendor_image || "🔔"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0f0f0f" }}>{n.title}</p>
                    {n.body && <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{n.body}</p>}
                    <p style={{ fontSize: 11, color: "#bbb", marginTop: 3 }}>{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read_at && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#e53935", flexShrink: 0, marginTop: 4 }} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
