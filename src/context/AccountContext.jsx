import { useEffect, useState } from "react";
import { AccountCtx } from "./accountStore.js";
import { API_BASE } from "../data/index.js";

async function apiRequest(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export function AccountProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("kivo_token") || "");
  const [initializing, setInitializing] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;
    apiRequest("/api/auth/me", { token })
      .then(({ user: freshUser }) => setUser(freshUser))
      .catch(() => {
        localStorage.removeItem("kivo_token");
        setToken("");
        setUser(null);
      })
      .finally(() => setInitializing(false));
  }, [token]);

  const completeAuth = ({ user: authedUser, token: sessionToken }) => {
    localStorage.setItem("kivo_token", sessionToken);
    setToken(sessionToken);
    setUser(authedUser);
  };

  const register = async (form) => {
    const data = await apiRequest("/api/auth/register", { method: "POST", body: form });
    completeAuth(data);
  };

  const login = async (form) => {
    const data = await apiRequest("/api/auth/login", { method: "POST", body: form });
    completeAuth(data);
  };

  const logout = () => {
    localStorage.removeItem("kivo_token");
    setToken("");
    setUser(null);
    setInitializing(false);
  };

  return (
    <AccountCtx.Provider value={{ user, initializing, register, login, logout }}>
      {children}
    </AccountCtx.Provider>
  );
}
