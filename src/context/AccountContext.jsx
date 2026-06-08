import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/index.js";

const AccountCtx = createContext(null);

export function AccountProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Rehydrate session on mount
  useEffect(() => {
    const token = localStorage.getItem("kivo_token");
    if (!token) { setInitializing(false); return; }

    authApi.me()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem("kivo_token"))
      .finally(() => setInitializing(false));
  }, []);

  const completeAuth = ({ user, token }) => {
    localStorage.setItem("kivo_token", token);
    setUser(user);
  };

  const register = async (form) => {
    const data = await authApi.register(form);
    completeAuth(data);
  };

  const login = async (form) => {
    const data = await authApi.login(form);
    completeAuth(data);
  };

  const logout = () => {
    localStorage.removeItem("kivo_token");
    setUser(null);
  };

  return (
    <AccountCtx.Provider value={{ user, initializing, register, login, logout }}>
      {children}
    </AccountCtx.Provider>
  );
}

export const useAccount = () => useContext(AccountCtx);
