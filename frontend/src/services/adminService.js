// client/src/services/adminService.js
import api from "./api";

export const getUsers = async () => {
  const { data } = await api.get("/admin/users");
  return data;
};

export const getAdminExpenses = async () => {
  const { data } = await api.get("/admin/expenses");
  return data;
};

export const getAdminSummary = async () => {
  const { data } = await api.get("/admin/summary");
  return data;
};

export const updateUser = async (id, payload) => {
  const { data } = await api.patch(`/admin/users/${id}`, payload);
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data;
};
