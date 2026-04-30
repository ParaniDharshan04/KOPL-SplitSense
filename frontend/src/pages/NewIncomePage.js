// client/src/pages/NewIncomePage.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createIncome } from "../services/incomeService";
import { parseApiError } from "../services/api";

const categories = ["Salary", "Freelance", "Investment", "Business", "Gift", "Other"];

const NewIncomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Salary",
    date: "",
    description: "",
  });

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);

      await createIncome({
        title: form.title,
        amount: Number(form.amount),
        category: form.category,
        date: form.date || undefined,
        description: form.description,
      });

      toast.success("Income added successfully");
      navigate("/income");
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ maxWidth: 900, margin: "0 auto" }}>
      <Link className="btn-link" to="/income">Back to income</Link>
      <h1 className="page-title" style={{ marginTop: "0.6rem" }}>New Income</h1>
      <p className="page-subtitle">Add a new income source to track your earnings.</p>

      <form className="form-card form-grid" onSubmit={onSubmit}>
        <div className="card-grid">
          <div className="form-row">
            <label htmlFor="income-title">Title</label>
            <input id="income-title" name="title" value={form.title} onChange={onChange} required />
          </div>

          <div className="form-row">
            <label htmlFor="income-amount">Amount</label>
            <input id="income-amount" name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={onChange} required />
          </div>

          <div className="form-row">
            <label htmlFor="income-category">Category</label>
            <select id="income-category" name="category" value={form.category} onChange={onChange}>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="income-date">Date</label>
            <input id="income-date" name="date" type="date" value={form.date} onChange={onChange} />
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="income-description">Description</label>
          <textarea id="income-description" name="description" rows="3" value={form.description} onChange={onChange} />
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Income"}
        </button>
      </form>
    </section>
  );
};

export default NewIncomePage;
