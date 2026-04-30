// client/src/pages/LoginPage.js
import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { parseApiError } from "../services/api";

const LoginPage = () => {
  const { login, isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to={user?.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      const loggedInUser = await login(form);
      const redirectTo = location.state?.from?.pathname || (loggedInUser?.role === "admin" ? "/admin" : "/dashboard");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <div className="auth-logo">S</div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue managing expenses.</p>

        <form className="form-grid" onSubmit={onSubmit}>
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" value={form.email} onChange={onChange} required />
          </div>

          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" name="password" value={form.password} onChange={onChange} required />
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="small" style={{ marginTop: "0.9rem" }}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </section>
    </div>
  );
};

export default LoginPage;
