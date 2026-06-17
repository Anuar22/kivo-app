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

  // Register no longer logs the user in immediately — it returns
  // { pendingVerification: true, email } so the UI can show the OTP screen.
  const register = async (form) => {
    return await authApi.register(form);
  };

  const login = async (form) => {
    const data = await authApi.login(form);
    completeAuth(data);
    return data;
  };

  const verifyEmail = async (email, code) => {
    const data = await authApi.verifyEmail({ email, code });
    completeAuth(data);
    return data;
  };

  const resendCode = async (email, purpose = "verify_email") => {
    return await authApi.resendCode({ email, purpose });
  };

  const forgotPassword = async (email) => {
    return await authApi.forgotPassword({ email });
  };

  const resetPassword = async (email, code, newPassword) => {
    const data = await authApi.resetPassword({ email, code, newPassword });
    completeAuth(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("kivo_token");
    setUser(null);
  };

  // Merge updated fields (e.g. after a profile edit) into the live user object
  const updateUser = (patch) => {
    setUser(prev => prev ? { ...prev, ...patch } : prev);
  };

  return (
    <AccountCtx.Provider value={{
      user, initializing, register, login, logout, updateUser,
      verifyEmail, resendCode, forgotPassword, resetPassword,
    }}>
      {children}
    </AccountCtx.Provider>
  );
}

export const useAccount = () => useContext(AccountCtx);
