// client/src/pages/NewExpensePage.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createExpense, createSharedExpense } from "../services/expenseService";
import { parseApiError } from "../services/api";

const categories = ["Food", "Travel", "Rent", "Utilities", "Entertainment", "Medical", "Other"];

const parseCustomAmounts = (value) => {
  // Format: email:amount,email:amount
  const parsed = {};
  if (!value.trim()) {
    return parsed;
  }

  value.split(",").forEach((entry) => {
    const [email, amount] = entry.split(":").map((item) => item.trim());
    if (email) {
      parsed[email.toLowerCase()] = Number(amount);
    }
  });

  return parsed;
};

const NewExpensePage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: "",
    description: "",
    splitWith: "",
    splitType: "equal",
    customAmountsText: "",
  });

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);

      const basePayload = {
        title: form.title,
        amount: Number(form.amount),
        category: form.category,
        date: form.date || undefined,
        description: form.description,
      };

      if (mode === "personal") {
        await createExpense(basePayload);
        toast.success("Expense added successfully");
      } else {
        const splitWith = form.splitWith
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean);

        const payload = {
          ...basePayload,
          splitWith,
          splitType: form.splitType,
          customAmounts: form.splitType === "custom" ? parseCustomAmounts(form.customAmountsText) : {},
        };

        await createSharedExpense(payload);
        toast.success("Shared expense created successfully");
      }

      navigate("/expenses");
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ maxWidth: 900, margin: "0 auto" }}>
      <Link className="btn-link" to="/expenses">Back to expenses</Link>
      <h1 className="page-title" style={{ marginTop: "0.6rem" }}>New Expense</h1>
      <p className="page-subtitle">Add a new expense to track and split.</p>

      <div className="tab-row">
        <button type="button" className={`tab ${mode === "personal" ? "active" : ""}`} onClick={() => setMode("personal")}>
          Personal
        </button>
        <button type="button" className={`tab ${mode === "shared" ? "active" : ""}`} onClick={() => setMode("shared")}>
          Shared
        </button>
      </div>

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

        {mode === "shared" && (
          <>
            <div className="form-row">
              <label htmlFor="splitWith">Split With (comma-separated emails)</label>
              <input
                id="splitWith"
                name="splitWith"
                value={form.splitWith}
                onChange={onChange}
                placeholder="alex@mail.com,lee@mail.com"
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="splitType">Split Type</label>
              <select id="splitType" name="splitType" value={form.splitType} onChange={onChange}>
                <option value="equal">Equal</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {form.splitType === "custom" && (
              <div className="form-row">
                <label htmlFor="customAmountsText">Custom Amounts (email:amount,email:amount)</label>
                <textarea
                  id="customAmountsText"
                  name="customAmountsText"
                  rows="2"
                  value={form.customAmountsText}
                  onChange={onChange}
                  placeholder="alex@mail.com:33.34,lee@mail.com:33.33"
                  required
                />
              </div>
            )}
          </>
        )}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Expense"}
        </button>
      </form>
    </section>
  );
};

export default NewExpensePage;
