// client/src/pages/EditIncomePage.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { getIncomeById, updateIncome } from "../services/incomeService";
import { parseApiError } from "../services/api";

const categories = ["Salary", "Freelance", "Investment", "Business", "Gift", "Other"];

const EditIncomePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [income, setIncome] = useState(null);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Salary",
    date: "",
    description: "",
  });

  useEffect(() => {
    const loadIncome = async () => {
      try {
        setLoading(true);
        const response = await getIncomeById(id);
        const record = response.data?.income;

        setIncome(record || null);

        if (record) {
          setForm({
            title: record.title || "",
            amount: record.amount ?? "",
            category: record.category || "Salary",
            date: record.date ? new Date(record.date).toISOString().slice(0, 10) : "",
            description: record.description || "",
          });
        }
      } catch (error) {
        toast.error(parseApiError(error));
      } finally {
        setLoading(false);
      }
    };

    loadIncome();
  }, [id]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      await updateIncome(id, {
        title: form.title,
        amount: Number(form.amount),
        category: form.category,
        date: form.date || undefined,
        description: form.description,
      });
      toast.success("Income updated successfully");
      navigate("/income");
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading income for edit..." />;
  }

  if (!income) {
    return <EmptyState title="Income not found" subtitle="This income record may have been removed." />;
  }

  return (
    <section style={{ maxWidth: 900, margin: "0 auto" }}>
      <Link className="btn-link" to="/income">Back to income</Link>
      <h1 className="page-title" style={{ marginTop: "0.6rem" }}>Edit Income</h1>
      <p className="page-subtitle">Update the details for this income record.</p>

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

        <div className="toolbar" style={{ justifyContent: "flex-start" }}>
          <Link className="btn btn-ghost" to="/income">
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

export default EditIncomePage;
