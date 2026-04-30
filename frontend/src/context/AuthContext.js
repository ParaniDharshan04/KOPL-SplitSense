// client/src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("et_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const persistSession = (payload) => {
    localStorage.setItem("et_user", JSON.stringify(payload.user));
    localStorage.setItem("et_access_token", payload.accessToken);
    localStorage.setItem("et_refresh_token", payload.refreshToken);
    setUser(payload.user);
  };

  const register = async (formData) => {
    const response = await authService.register(formData);
    persistSession(response.data);
    toast.success(response.message || "Registered successfully");
  };

  const login = async (formData) => {
    const response = await authService.login(formData);
    persistSession(response.data);
    toast.success(response.message || "Login successful");
    return response.data?.user;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("et_refresh_token");
      if (refreshToken) {
        await authService.logout({ refreshToken });
      }
    } catch (error) {
      // Intentional no-op: logout should still clear local state.
    } finally {
      localStorage.removeItem("et_user");
      localStorage.removeItem("et_access_token");
      localStorage.removeItem("et_refresh_token");
      setUser(null);
      toast.info("Logged out");
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      register,
      login,
      logout,
      setUser,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
