// client/src/App.js
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ExpensesPage from "./pages/ExpensesPage";
import NewExpensePage from "./pages/NewExpensePage";
import EditExpensePage from "./pages/EditExpensePage";
import ExpenseDetailPage from "./pages/ExpenseDetailPage";
import SharedPage from "./pages/SharedPage";
import BalancesPage from "./pages/BalancesPage";
import AdminPage from "./pages/AdminPage";
import IncomePage from "./pages/IncomePage";
import NewIncomePage from "./pages/NewIncomePage";
import EditIncomePage from "./pages/EditIncomePage";

function App() {
  return (
    <ErrorBoundary>
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <ExpensesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses/new"
              element={
                <ProtectedRoute>
                  <NewExpensePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses/:id/edit"
              element={
                <ProtectedRoute>
                  <EditExpensePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses/:id"
              element={
                <ProtectedRoute>
                  <ExpenseDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/income"
              element={
                <ProtectedRoute>
                  <IncomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/income/new"
              element={
                <ProtectedRoute>
                  <NewIncomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/income/:id/edit"
              element={
                <ProtectedRoute>
                  <EditIncomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shared"
              element={
                <ProtectedRoute>
                  <SharedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/balances"
              element={
                <ProtectedRoute>
                  <BalancesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <RoleRoute role="admin">
                  <AdminPage />
                </RoleRoute>
              }
            />

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
