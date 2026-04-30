// client/src/context/ExpenseContext.js
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import * as expenseService from "../services/expenseService";

const ExpenseContext = createContext(null);

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({
    totalSpend: 0,
    totalCount: 0,
    categoryBreakdown: [],
    monthlyTrend: [],
  });

  const refreshExpenses = useCallback(async (filters = {}) => {
    const response = await expenseService.getExpenses(filters);
    setExpenses(response.data.expenses || []);
    return response;
  }, []);

  const refreshSummary = useCallback(async (filters = {}) => {
    const response = await expenseService.getSummary(filters);
    setSummary(response.data || {
      totalSpend: 0,
      totalCount: 0,
      categoryBreakdown: [],
      monthlyTrend: [],
    });
    return response;
  }, []);

  const value = useMemo(
    () => ({
      expenses,
      summary,
      setExpenses,
      refreshExpenses,
      refreshSummary,
    }),
    [expenses, summary, refreshExpenses, refreshSummary]
  );

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};

export const useExpenses = () => {
  return useContext(ExpenseContext);
};
