// client/src/pages/DashboardPage.js
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { useExpenses } from "../context/ExpenseContext";
import { useIncomes } from "../context/IncomeContext";
import { useAuth } from "../context/AuthContext";
import { parseApiError } from "../services/api";

import { formatCurrency, formatDate } from "../utils/format";

const PIE_COLORS = ["#6b8e7f", "#b4a89a", "#e0a96d", "#8ba69e", "#c85a54", "#d4cfc4"]; 

const MONTH_LABELS = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
};

const formatMonthLabel = (value) => {
  if (!value) return value;
  const parts = value.split("-");
  if (parts.length !== 2) return value;
  const monthName = MONTH_LABELS[parts[1]] || parts[1];
  return `${monthName} ${parts[0].slice(2)}`;
};

const DashboardPage = () => {
  const { expenses, summary, refreshExpenses, refreshSummary } = useExpenses();
  const { incomeSummary, refreshIncomeSummary } = useIncomes();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          refreshSummary(),
          refreshExpenses(),
          refreshIncomeSummary(),
        ]);
      } catch (error) {
        toast.error(parseApiError(error));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refreshExpenses, refreshSummary, refreshIncomeSummary]);

  const recentExpenses = useMemo(() => (expenses || []).slice(0, 10), [expenses]);

  // Merge expense and income monthly trends for the bar chart
  const monthlyChartData = useMemo(() => {
    const map = new Map();

    (summary.monthlyTrend || []).forEach((item) => {
      const existing = map.get(item.month) || { month: item.month, expenses: 0, income: 0 };
      existing.expenses = item.total;
      map.set(item.month, existing);
    });

    (incomeSummary.monthlyTrend || []).forEach((item) => {
      const existing = map.get(item.month) || { month: item.month, expenses: 0, income: 0 };
      existing.income = item.total;
      map.set(item.month, existing);
    });

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [summary.monthlyTrend, incomeSummary.monthlyTrend]);

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  const netSavings = (incomeSummary.totalIncome || 0) - (summary.totalSpend || 0);

  const stats = [
    {
      label: "Total Savings",
      value: formatCurrency(incomeSummary.totalIncome || 0),
      helper: `${incomeSummary.totalCount || 0} records`,
      color: "var(--accent)",
    },
    {
      label: "Total Spend",
      value: formatCurrency(summary.totalSpend || 0),
      helper: `${summary.totalCount || 0} expenses`,
      color: "var(--warn)",
    },
    {
      label: "Net Savings",
      value: formatCurrency(netSavings),
      helper: netSavings >= 0 ? "You're saving 💰" : "Spending exceeds income",
      color: netSavings >= 0 ? "var(--accent)" : "var(--warn)",
    },
  ];

  return (
    <section>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">
        Welcome back{user?.name ? `, ${user.name}` : ""}! Here's your financial overview.
      </p>

      <div className="card-grid" style={{ marginBottom: "1.25rem" }}>
        {stats.map((stat) => (
          <article key={stat.label} className="card">
            <p className="small">{stat.label}</p>
            <p className="value" style={stat.color ? { color: stat.color } : undefined}>{stat.value}</p>
            <p className="small">{stat.helper}</p>
          </article>
        ))}
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginBottom: "1.25rem" }}>
        {/* Monthly Trend Bar Chart */}
        <div className="panel" style={{ gridColumn: "span 2", display: "flex", flexDirection: "column" }}>
          <div className="panel-head">
            <h2 className="page-title" style={{ fontSize: "1.4rem", margin: 0 }}>Monthly Trend</h2>
          </div>
          {monthlyChartData.length === 0 ? (
            <EmptyState title="No monthly data" subtitle="Monthly trend appears once transactions are added." />
          ) : (
            <div style={{ width: "100%", height: 300, marginTop: "0.5rem" }}>
              <ResponsiveContainer>
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }} barCategoryGap="30%" barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonthLabel}
                    tick={{ fill: "var(--muted)", fontSize: 12 }}
                    axisLine={{ stroke: "var(--line)" }}
                    padding={{ left: 40, right: 40 }}
                  />
                  <YAxis
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    tick={{ fill: "var(--muted)", fontSize: 12 }}
                    axisLine={{ stroke: "var(--line)" }}
                    width={55}
                  />
                  <Tooltip
                    formatter={(value, name) => [formatCurrency(value), name === "income" ? "Income" : "Expenses"]}
                    labelFormatter={formatMonthLabel}
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      borderRadius: 12,
                      boxShadow: "var(--shadow)",
                    }}
                  />
                  <Bar dataKey="income" name="income" fill="#6b8e7f" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  <Bar dataKey="expenses" name="expenses" fill="#c85a54" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category Pie Chart */}
        <div className="panel">
          <div className="panel-head">
            <h2 className="page-title" style={{ fontSize: "1.4rem", margin: 0 }}>Spending by Category</h2>
          </div>
          {(summary.categoryBreakdown || []).length === 0 ? (
            <EmptyState title="No category data" subtitle="Category chart appears once expenses are added." />
          ) : (
            <div>
              <div style={{ width: "100%", height: 260, display: "flex", justifyContent: "center" }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={summary.categoryBreakdown}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      stroke="#faf8f5"
                      strokeWidth={2}
                    >
                      {summary.categoryBreakdown.map((entry, index) => (
                        <Cell key={entry.category} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "grid", gap: "0.75rem", marginTop: "1.2rem" }}>
                {summary.categoryBreakdown.map((entry, index) => (
                  <div
                    key={entry.category}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span
                        aria-hidden="true"
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: PIE_COLORS[index % PIE_COLORS.length],
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: "0.95rem" }}>{entry.category}</span>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{formatCurrency(entry.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Expenses Table */}
      <div className="panel">
        <div className="panel-head">
          <h2 className="page-title" style={{ fontSize: "1.4rem", margin: 0 }}>Recent Expenses</h2>
          <Link className="btn-link" to="/expenses">View all</Link>
        </div>

        {recentExpenses.length === 0 ? (
          <EmptyState title="No expenses yet" subtitle="Add your first expense to populate the dashboard." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <Link to={`/expenses/${item._id}`}>{item.title}</Link>
                    </td>
                    <td>{item.category}</td>
                    <td>{formatDate(item.date)}</td>
                    <td>{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default DashboardPage;
