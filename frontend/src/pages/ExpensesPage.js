// client/src/pages/ExpensesPage.js
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import { useExpenses } from "../context/ExpenseContext";
import { deleteExpense, deleteAllExpenses } from "../services/expenseService";
import { parseApiError } from "../services/api";
import { formatCurrency, formatDate } from "../utils/format";

const categories = ["", "Food", "Travel", "Rent", "Utilities", "Entertainment", "Medical", "Other"];

const ExpensesPage = () => {
  const { expenses, refreshExpenses } = useExpenses();
  const [filters, setFilters] = useState({ category: "", startDate: "", endDate: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      await refreshExpenses(filters);
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setLoading(false);
    }
  }, [filters, refreshExpenses]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const onDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) {
      return;
    }

    try {
      await deleteExpense(id);
      toast.success("Expense deleted");
      loadExpenses();
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const onDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete all expenses? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      await deleteAllExpenses();
      toast.success("All expenses deleted successfully");
      loadExpenses();
    } catch (error) {
      toast.error(parseApiError(error));
      setLoading(false);
    }
  };

  const onFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredExpenses = expenses.filter((item) => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      !filters.type ||
      (filters.type === "shared" && item.isShared) ||
      (filters.type === "personal" && !item.isShared);
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <LoadingSpinner text="Loading expenses..." />;
  }

  return (
    <section>
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Manage and track all your expenses</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {expenses.length > 0 && (
            <button className="btn admin-add-btn" onClick={onDeleteAll} style={{ background: "var(--danger, #ef4444)", borderColor: "var(--danger, #ef4444)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              Delete All
            </button>
          )}
          <Link className="btn admin-add-btn" to="/expenses/new">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Expense
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="expense-filter-bar">
        <div className="expense-search-wrap">
          <svg className="expense-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="expense-search"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="expense-filter-group">
          <div className="expense-filter-select-wrap">
            <svg className="expense-filter-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <select
              className="expense-filter-select"
              name="category"
              value={filters.category}
              onChange={onFilterChange}
            >
              {categories.map((item) => (
                <option key={item || "all"} value={item}>
                  {item || "All Categories"}
                </option>
              ))}
            </select>
          </div>
          <select
            className="expense-filter-select expense-filter-status"
            name="type"
            value={filters.type || ""}
            onChange={onFilterChange}
          >
            <option value="">All Status</option>
            <option value="shared">Shared</option>
            <option value="personal">Personal</option>
          </select>
        </div>
      </div>

      <div className="panel">
        {filteredExpenses.length === 0 ? (
          <EmptyState title="No expenses found" subtitle="Try adjusting filters or adding a new expense." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <Link to={`/expenses/${item._id}`}>{item.title}</Link>
                    </td>
                    <td>{item.category}</td>
                    <td>{formatDate(item.date)}</td>
                    <td>{formatCurrency(item.amount)}</td>
                    <td>{item.isShared ? <span className="status-pill">Shared</span> : <span className="status-pill" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>Personal</span>}</td>
                    <td>
                      <div className="admin-actions-cell">
                        <Link className="admin-icon-btn admin-icon-btn--view" to={`/expenses/${item._id}`} title="View">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </Link>
                        <Link className="admin-icon-btn admin-icon-btn--edit" to={`/expenses/${item._id}/edit`} title="Edit">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                            <path d="m15 5 4 4"/>
                          </svg>
                        </Link>
                        <button className="admin-icon-btn admin-icon-btn--delete" type="button" onClick={() => onDelete(item._id)} title="Delete">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
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

export default ExpensesPage;
