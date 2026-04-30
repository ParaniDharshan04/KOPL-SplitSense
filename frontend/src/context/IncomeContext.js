// client/src/context/IncomeContext.js
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import * as incomeService from "../services/incomeService";

const IncomeContext = createContext(null);

export const IncomeProvider = ({ children }) => {
  const [incomes, setIncomes] = useState([]);
  const [incomeSummary, setIncomeSummary] = useState({
    totalIncome: 0,
    totalCount: 0,
    categoryBreakdown: [],
    monthlyTrend: [],
  });

  const refreshIncomes = useCallback(async (filters = {}) => {
    const response = await incomeService.getIncomes(filters);
    setIncomes(response.data.incomes || []);
    return response;
  }, []);

  const refreshIncomeSummary = useCallback(async (filters = {}) => {
    const response = await incomeService.getIncomeSummary(filters);
    setIncomeSummary(response.data || {
      totalIncome: 0,
      totalCount: 0,
      categoryBreakdown: [],
      monthlyTrend: [],
    });
    return response;
  }, []);

  const value = useMemo(
    () => ({
      incomes,
      incomeSummary,
      setIncomes,
      refreshIncomes,
      refreshIncomeSummary,
    }),
    [incomes, incomeSummary, refreshIncomes, refreshIncomeSummary]
  );

  return <IncomeContext.Provider value={value}>{children}</IncomeContext.Provider>;
};

export const useIncomes = () => {
  return useContext(IncomeContext);
};
