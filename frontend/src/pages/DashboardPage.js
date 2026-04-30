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
} from "recharts";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { useExpenses } from "../context/ExpenseContext";
import { useAuth } from "../context/AuthContext";
import { parseApiError } from "../services/api";
import { getIOwe, getOwedToMe } from "../services/expenseService";
import { formatCurrency, formatDate } from "../utils/format";

const PIE_COLORS = ["#6b8e7f", "#b4a89a", "#e0a96d", "#8ba69e", "#c85a54", "#d4cfc4"]; 

const DashboardPage = () => {
  const { expenses, summary, refreshExpenses, refreshSummary } = useExpenses();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sharedTotals, setSharedTotals] = useState({ youOwe: 0, owedToYou: 0 });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [_, __, owedRes, oweRes] = await Promise.all([
          refreshSummary(),
          refreshExpenses(),
          getOwedToMe(),
          getIOwe(),
        ]);

        const owedToMe = (owedRes.data.owedToMe || []).reduce(
          (sum, row) => sum + Number(row.totalPending || 0),
          0
        );
        const iOwe = (oweRes.data.iOwe || []).reduce(
          (sum, row) => sum + Number(row.totalPending || 0),
          0
        );

        setSharedTotals({ youOwe: iOwe, owedToYou: owedToMe });
      } catch (error) {
        toast.error(parseApiError(error));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refreshExpenses, refreshSummary]);

  const recentExpenses = useMemo(() => (expenses || []).slice(0, 10), [expenses]);

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  const stats = [
    {
      label: "Total Spend",
      value: formatCurrency(summary.totalSpend || 0),
      helper: `${summary.totalCount || 0} expenses`,
    },
    {
      label: "You Owe",
      value: formatCurrency(sharedTotals.youOwe || 0),
      helper: "Pending payables",
    },
    {
      label: "Owed to You",
      value: formatCurrency(sharedTotals.owedToYou || 0),
      helper: "Pending receivables",
    },
    {
      label: "Shared Expenses",
      value: `${(expenses || []).filter((item) => item.isShared).length}`,
      helper: "Shared records",
    },
  ];

  return (
    <section>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">
        Welcome back{user?.name ? `, ${user.name}` : ""}! Here's your expense overview.
      </p>

      <div className="card-grid" style={{ marginBottom: "1.25rem" }}>
        {stats.map((stat) => (
          <article key={stat.label} className="card">
            <p className="small">{stat.label}</p>
            <p className="value">{stat.value}</p>
            <p className="small">{stat.helper}</p>
          </article>
        ))}
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginBottom: "1.25rem" }}>
        <div className="panel" style={{ gridColumn: "span 2", display: "flex", flexDirection: "column" }}>
          <div className="panel-head">
            <h2 className="page-title" style={{ fontSize: "1.4rem", margin: 0 }}>Recent Expenses</h2>
            <Link className="btn-link" to="/expenses">View all</Link>
          </div>

          {recentExpenses.length === 0 ? (
            <EmptyState title="No expenses yet" subtitle="Add your first expense to populate the dashboard." />
          ) : (
            <div className="table-wrap" style={{ flex: 1, overflow: "hidden" }}>
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
    </section>
  );
};

export default DashboardPage;
