// client/src/components/Navbar.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  deleteNotification,
  getNotifications,
  markNotificationRead,
} from "../services/notificationService";
import { formatDate } from "../utils/format";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const autoHideTimerRef = useRef(null);

  const getInitials = (name) => {
    if (!name) {
      return "U";
    }
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  };

  useEffect(() => {
    let active = true;
    let intervalId;

    const loadNotifications = async () => {
      if (!isAuthenticated) {
        return;
      }

      try {
        const response = await getNotifications();
        if (active) {
          setNotifications(response?.data?.notifications || []);
        }
      } catch (error) {
        // Silent failure keeps nav usable even if notifications endpoint fails.
      }
    };

    if (isAuthenticated) {
      // Reset old user's notifications immediately when auth identity changes.
      setNotifications([]);
      loadNotifications();
      intervalId = setInterval(loadNotifications, 30000);
    } else {
      setNotifications([]);
      setShowNotifications(false);
    }

    return () => {
      active = false;
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = null;
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAuthenticated, user?._id]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const onDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      // Silent failure keeps nav usable even if delete request fails.
    }
  };

  const onToggleNotifications = async () => {
    const nextOpen = !showNotifications;

    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }

    setShowNotifications(nextOpen);

    if (!nextOpen) {
      return;
    }

    autoHideTimerRef.current = setTimeout(() => {
      setShowNotifications(false);
      autoHideTimerRef.current = null;
    }, 5000);

    const unread = notifications.filter((item) => !item.isRead);
    if (unread.length === 0) {
      return;
    }

    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));

    await Promise.all(
      unread.map((item) => markNotificationRead(item._id).catch(() => null))
    );
  };

  if (["/login", "/register"].includes(location.pathname) && !isAuthenticated) {
    return null;
  }

  return (
    <header className="navbar">
      <div className="brand-wrap">
        <Link to="/dashboard" className="brand-link">
          <span className="brand-mark">S</span>
          <span>SplitSense</span>
        </Link>
      </div>

      {isAuthenticated ? (
        <>
          <nav className="nav-links">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/expenses">Expenses</NavLink>
            <NavLink to="/shared">Shared</NavLink>
            <NavLink to="/balances">Balances</NavLink>
            {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
          </nav>
          <div className="user-box">
            <button type="button" className="notif-btn" onClick={onToggleNotifications} aria-label="Notifications">
              <svg className="notif-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>
            {showNotifications && (
              <div className="notif-panel">
                {notifications.length === 0 ? (
                  <p className="small">No notifications yet.</p>
                ) : (
                  notifications.map((item) => (
                    <article key={item._id} className="notif-item">
                      <div className="notif-head">
                        <p className="notif-title">{item.title}</p>
                        <button
                          type="button"
                          className="notif-remove"
                          onClick={() => onDeleteNotification(item._id)}
                        >
                          Remove
                        </button>
                      </div>
                      <p className="small">{item.message}</p>
                      <p className="small">{formatDate(item.createdAt)}</p>
                    </article>
                  ))
                )}
              </div>
            )}
            <span className="avatar">{getInitials(user?.name)}</span>
            <span className="user-label">{user?.name}</span>
            <button type="button" onClick={logout} className="btn btn-ghost">
              Logout
            </button>
          </div>
        </>
      ) : (
        <nav className="nav-links">
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/register">Register</NavLink>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
