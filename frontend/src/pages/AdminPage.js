// client/src/pages/AdminPage.js
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import { deleteUser, getAdminSummary, getUsers, updateUser } from "../services/adminService";
import { parseApiError } from "../services/api";
import { formatDate } from "../utils/format";

const AdminPage = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("user");


  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("");
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [summaryRes, usersRes] = await Promise.all([
        getAdminSummary(),
        getUsers(),
      ]);
      setSummary(summaryRes.data || {});
      setUsers(usersRes.data.users || []);
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const onDeleteUser = async (id) => {
    if (!window.confirm("Delete this user and related records?")) {
      return;
    }
    try {
      await deleteUser(id);
      toast.success("User removed");
      loadAdminData();
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const onStartEdit = (user) => {
    setEditingUser(user._id);
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setEditRole(user.role || "user");
  };

  const onCancelEdit = () => {
    setEditingUser(null);
    setEditName("");
    setEditEmail("");
    setEditRole("user");
  };

  const onSaveEdit = async (id) => {
    try {
      await updateUser(id, { name: editName, email: editEmail, role: editRole });
      toast.success("User updated");
      onCancelEdit();
      loadAdminData();
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  const thisYearStart = new Date(now.getFullYear(), 0, 1);

  const totalUsers = users.length;
  const newThisWeek = users.filter(
    (u) => new Date(u.createdAt) >= thisWeekStart
  ).length;
  const newThisMonth = users.filter(
    (u) => new Date(u.createdAt) >= thisMonthStart
  ).length;
  const totalThisYear = users.filter(
    (u) => new Date(u.createdAt) >= thisYearStart
  ).length;

  if (loading) {
    return <LoadingSpinner text="Loading admin panel..." />;
  }

  return (
    <section>
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">Manage users and permissions</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="admin-stats">
        <article className="admin-stat-card">
          <div className="admin-stat-head">
            <span className="admin-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="admin-stat-label">Total Users</span>
          </div>
          <p className="admin-stat-value">{summary?.users || totalUsers}</p>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-head">
            <span className="admin-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="admin-stat-label">New This Week</span>
          </div>
          <p className="admin-stat-value">{newThisWeek}</p>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-head">
            <span className="admin-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="admin-stat-label">New This Month</span>
          </div>
          <p className="admin-stat-value">{newThisMonth}</p>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-head">
            <span className="admin-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="admin-stat-label">Total This Year</span>
          </div>
          <p className="admin-stat-value">{totalThisYear}</p>
        </article>
      </div>

      {/* Users Panel */}
      <article className="admin-users-panel">
        {/* Search */}
        <div className="admin-search-wrap">
          <svg className="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="admin-search"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* User Table */}
        {filteredUsers.length === 0 ? (
          <EmptyState title="No users found" subtitle="Try a different search term." />
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Join Date</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <React.Fragment key={user._id}>
                    {editingUser === user._id ? (
                      <tr className="admin-edit-row">
                        <td>
                          <div className="admin-edit-field">
                            <label className="small">Name</label>
                            <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                          </div>
                        </td>
                        <td>
                          <div className="admin-edit-field">
                            <label className="small">Email</label>
                            <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                          </div>
                        </td>
                        <td></td>
                        <td></td>
                        <td>
                          <div className="admin-edit-actions">
                            <button type="button" className="btn" onClick={() => onSaveEdit(user._id)}>Save</button>
                            <button type="button" className="btn btn-ghost" onClick={onCancelEdit}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td>
                          <div className="admin-user-cell">
                            <span className="admin-avatar">{getInitials(user.name)}</span>
                            <span className="admin-user-name">{user.name}</span>
                          </div>
                        </td>
                        <td>
                          <div className="admin-email-cell">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="4" width="20" height="16" rx="2" />
                              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                            <span>{user.email}</span>
                          </div>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <span className={`admin-status-pill ${user.role === "admin" ? "admin-status--inactive" : "admin-status--active"}`}>
                            {user.role === "admin" ? "Admin" : "User"}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions-cell">
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-btn--edit"
                              onClick={() => onStartEdit(user)}
                              title="Edit user"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-btn--delete"
                              onClick={() => onDeleteUser(user._id)}
                              title="Delete user"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>


    </section>
  );
};

export default AdminPage;
