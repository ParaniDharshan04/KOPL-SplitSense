// client/src/pages/IncomePage.js
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import { useIncomes } from "../context/IncomeContext";
import { deleteIncome, deleteAllIncomes } from "../services/incomeService";
import { parseApiError } from "../services/api";
import { formatCurrency, formatDate } from "../utils/format";

const categories = ["", "Salary", "Freelance", "Investment", "Business", "Gift", "Other"];

const IncomePage = () => {
  const { incomes, refreshIncomes } = useIncomes();
  const [filters, setFilters] = useState({ category: "", startDate: "", endDate: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const loadIncomes = useCallback(async () => {
    try {
      setLoading(true);
      await refreshIncomes(filters);
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setLoading(false);
    }
  }, [filters, refreshIncomes]);

  useEffect(() => {
    loadIncomes();
  }, [loadIncomes]);

  const onDelete = async (id) => {
    if (!window.confirm("Delete this income?")) {
      return;
    }

    try {
      await deleteIncome(id);
      toast.success("Income deleted");
      loadIncomes();
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const onDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete all income records? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      await deleteAllIncomes();
      toast.success("All incomes deleted successfully");
      loadIncomes();
    } catch (error) {
      toast.error(parseApiError(error));
      setLoading(false);
    }
  };

  const onFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredIncomes = incomes.filter((item) => {
    return item.title?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return <LoadingSpinner text="Loading income..." />;
  }

  return (
    <section>
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="page-title">Income</h1>
          <p className="page-subtitle">Manage and track all your income sources</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {incomes.length > 0 && (
            <button className="btn admin-add-btn" onClick={onDeleteAll} style={{ background: "var(--danger, #ef4444)", borderColor: "var(--danger, #ef4444)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              Delete All
            </button>
          )}
          <Link className="btn admin-add-btn" to="/income/new">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Income
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
            placeholder="Search income..."
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
        </div>
      </div>

      <div className="panel">
        {filteredIncomes.length === 0 ? (
          <EmptyState title="No income found" subtitle="Try adjusting filters or adding a new income record." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncomes.map((item) => (
                  <tr key={item._id}>
                    <td>{item.title}</td>
                    <td>{item.category}</td>
                    <td>{formatDate(item.date)}</td>
                    <td style={{ color: "var(--accent)", fontWeight: 600 }}>+{formatCurrency(item.amount)}</td>
                    <td>
                      <div className="admin-actions-cell">
                        <Link className="admin-icon-btn admin-icon-btn--edit" to={`/income/${item._id}/edit`} title="Edit">
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

export default IncomePage;
