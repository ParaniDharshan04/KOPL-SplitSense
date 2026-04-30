// client/src/services/incomeService.js
import api from "./api";

export const createIncome = async (payload) => {
  const { data } = await api.post("/income", payload);
  return data;
};

export const getIncomes = async (params = {}) => {
  const { data } = await api.get("/income", { params });
  return data;
};

export const getIncomeById = async (id) => {
  const { data } = await api.get(`/income/${id}`);
  return data;
};

export const updateIncome = async (id, payload) => {
  const { data } = await api.put(`/income/${id}`, payload);
  return data;
};

export const deleteIncome = async (id) => {
  const { data } = await api.delete(`/income/${id}`);
  return data;
};

export const deleteAllIncomes = async () => {
  const { data } = await api.delete("/income/all");
  return data;
};

export const getIncomeSummary = async (params = {}) => {
  const { data } = await api.get("/income/summary", { params });
  return data;
};
