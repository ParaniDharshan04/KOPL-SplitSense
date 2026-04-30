// client/src/services/authService.js
import api from "./api";

export const register = async (payload) => {
  const { data } = await api.post("/auth/register", payload);
  return data;
};

export const login = async (payload) => {
  const { data } = await api.post("/auth/login", payload);
  return data;
};

export const logout = async (payload) => {
  const { data } = await api.post("/auth/logout", payload);
  return data;
};

export const refresh = async (payload) => {
  const { data } = await api.post("/auth/refresh", payload);
  return data;
};
