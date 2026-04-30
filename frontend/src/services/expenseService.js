// client/src/services/expenseService.js
import api from "./api";

export const createExpense = async (payload) => {
  const { data } = await api.post("/expenses", payload);
  return data;
};

export const createSharedExpense = async (payload) => {
  const { data } = await api.post("/expenses/shared", payload);
  return data;
};

export const getExpenses = async (params = {}) => {
  const { data } = await api.get("/expenses", { params });
  return data;
};

export const getExpenseById = async (id) => {
  const { data } = await api.get(`/expenses/${id}`);
  return data;
};

export const updateExpense = async (id, payload) => {
  const { data } = await api.put(`/expenses/${id}`, payload);
  return data;
};

export const deleteExpense = async (id) => {
  const { data } = await api.delete(`/expenses/${id}`);
  return data;
};

export const getSummary = async (params = {}) => {
  const { data } = await api.get("/expenses/summary", { params });
  return data;
};

export const getOwedToMe = async () => {
  const { data } = await api.get("/expenses/shared/owed-to-me");
  return data;
};

export const getIOwe = async () => {
  const { data } = await api.get("/expenses/shared/i-owe");
  return data;
};

export const getBalances = async () => {
  const { data } = await api.get("/expenses/balances");
  return data;
};

export const settleSplit = async (expenseId, splitId) => {
  const { data } = await api.post(`/settlements/${expenseId}/settle/${splitId}`);
  return data;
};
