// client/src/pages/EditExpensePage.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { getExpenseById, updateExpense } from "../services/expenseService";
import { parseApiError } from "../services/api";

const categories = ["Food", "Travel", "Rent", "Utilities", "Entertainment", "Medical", "Other"];

const EditExpensePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payload, setPayload] = useState(null);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: "",
    description: "",
  });

  useEffect(() => {
    const loadExpense = async () => {
      try {
        setLoading(true);
        const response = await getExpenseById(id);
        const expense = response.data?.expense;

        setPayload(response.data || null);

        if (expense) {
          setForm({
            title: expense.title || "",
            amount: expense.amount ?? "",
            category: expense.category || "Food",
            date: expense.date ? new Date(expense.date).toISOString().slice(0, 10) : "",
            description: expense.description || "",
          });
        }
      } catch (error) {
        toast.error(parseApiError(error));
      } finally {
        setLoading(false);
      }
    };

    loadExpense();
  }, [id]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      await updateExpense(id, {
        title: form.title,
        amount: Number(form.amount),
        category: form.category,
        date: form.date || undefined,
        description: form.description,
      });
      toast.success("Expense updated successfully");
      navigate("/expenses");
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading expense for edit..." />;
  }

  const expense = payload?.expense;

  if (!expense) {
    return <EmptyState title="Expense not found" subtitle="This expense may have been removed." />;
  }

  if (expense.isShared) {
    return (
      <section className="form-card" style={{ maxWidth: 760, margin: "0 auto" }}>
        <h1 className="page-title">Edit Expense</h1>
        <p className="page-subtitle">Shared expenses cannot be edited from this page.</p>
        <EmptyState
          title="Shared expense"
          subtitle="Please manage this record through the shared expense flow."
        />
        <div style={{ marginTop: "1rem" }}>
          <Link className="btn btn-ghost" to={`/expenses/${id}`}>
            Back to Detail
          </Link>{" "}
          <Link className="btn" to="/expenses">
            Back to Expenses
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 900, margin: "0 auto" }}>
      <Link className="btn-link" to={`/expenses/${id}`}>Back to expense</Link>
      <h1 className="page-title" style={{ marginTop: "0.6rem" }}>Edit Expense</h1>
      <p className="page-subtitle">Update the details for this expense.</p>

      <form className="form-card form-grid" onSubmit={onSubmit}>
        <div className="card-grid">
          <div className="form-row">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" value={form.title} onChange={onChange} required />
          </div>

          <div className="form-row">
            <label htmlFor="amount">Amount</label>
            <input id="amount" name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={onChange} required />
          </div>

          <div className="form-row">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" value={form.category} onChange={onChange}>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="date">Date</label>
            <input id="date" name="date" type="date" value={form.date} onChange={onChange} />
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" rows="3" value={form.description} onChange={onChange} />
        </div>

        <div className="toolbar" style={{ justifyContent: "flex-start" }}>
          <Link className="btn btn-ghost" to="/expenses">
            Cancel
          </Link>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default EditExpensePage;