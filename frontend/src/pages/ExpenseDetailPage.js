// client/src/pages/ExpenseDetailPage.js
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import { getExpenseById } from "../services/expenseService";
import { parseApiError } from "../services/api";
import { formatCurrency, formatDate } from "../utils/format";

const ExpenseDetailPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    const loadExpense = async () => {
      try {
        setLoading(true);
        const response = await getExpenseById(id);
        setPayload(response.data);
      } catch (error) {
        toast.error(parseApiError(error));
      } finally {
        setLoading(false);
      }
    };

    loadExpense();
  }, [id]);

  if (loading) {
    return <LoadingSpinner text="Loading expense details..." />;
  }

  if (!payload?.expense) {
    return <EmptyState title="Expense not found" subtitle="This record may have been removed." />;
  }

  const { expense, isFutureDate } = payload;

  return (
    <section>
      <div className="toolbar">
        <div>
          <h1 className="page-title">{expense.title}</h1>
          <p className="page-subtitle">
            {formatDate(expense.date)} • {expense.category} • {expense.isShared ? "Shared" : "Personal"}
            {isFutureDate ? " • Future" : ""}
          </p>
        </div>
        <Link className="btn btn-ghost" to="/expenses">Back to Expenses</Link>
      </div>

      <div className="card-grid" style={{ marginBottom: "1rem" }}>
        <article className="card">
          <p className="small">Total Amount</p>
          <p className="value">{formatCurrency(expense.amount)}</p>
        </article>
        <article className="card">
          <p className="small">Split Between</p>
          <p className="value">{expense.splitDetails?.length || 1} people</p>
        </article>
        <article className="card">
          <p className="small">Paid By</p>
          <p className="value">{expense.owner?.name || "You"}</p>
        </article>
      </div>

      {expense.description ? (
        <article className="panel" style={{ marginBottom: "1rem" }}>
          <h2 className="page-title" style={{ fontSize: "1.2rem" }}>Notes</h2>
          <p className="small">{expense.description}</p>
        </article>
      ) : null}

      {expense.isShared && (
        <article className="panel">
          <div className="panel-head">
            <h2 className="page-title" style={{ fontSize: "1.2rem", margin: 0 }}>Split Details</h2>
          </div>
          {expense.splitDetails?.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Settled At</th>
                  </tr>
                </thead>
                <tbody>
                  {expense.splitDetails.map((split) => (
                    <tr key={split._id}>
                      <td>{split.owedBy?.name || split.owedBy?._id || "Unknown"}</td>
                      <td>{formatCurrency(split.amountOwed)}</td>
                      <td>
                        {split.isCancelled ? (
                          <span className="status-pill" style={{ background: "#fde4dc", color: "#c85a54" }}>Cancelled</span>
                        ) : split.isSettled ? (
                          <span className="status-pill">Settled</span>
                        ) : (
                          <span className="small">Pending</span>
                        )}
                      </td>
                      <td>{formatDate(split.settledAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No split rows" subtitle="This shared expense has no split details." />
          )}
        </article>
      )}
    </section>
  );
};

export default ExpenseDetailPage;
