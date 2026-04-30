// client/src/pages/SharedPage.js
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import { getIOwe, getOwedToMe, settleSplit } from "../services/expenseService";
import { parseApiError } from "../services/api";
import { formatCurrency, formatDate } from "../utils/format";

const SharedPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialTab = params.get("tab") === "owe" ? "owe" : "owed";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [owedToMe, setOwedToMe] = useState([]);
  const [iOwe, setIOwe] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [owed, owe] = await Promise.all([getOwedToMe(), getIOwe()]);
      setOwedToMe(owed.data.owedToMe || []);
      setIOwe(owe.data.iOwe || []);
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSettle = async (expenseId, splitId) => {
    try {
      await settleSplit(expenseId, splitId);
      toast.success("Split settled");
      loadData();
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading shared expenses..." />;
  }

  return (
    <section>
      <h1 className="page-title">Shared Expenses</h1>
      <p className="page-subtitle">Track what others owe you and what you owe.</p>

      <div className="tab-row">
        <button type="button" className={`tab ${activeTab === "owed" ? "active" : ""}`} onClick={() => setActiveTab("owed")}>
          I&apos;m Owed
        </button>
        <button type="button" className={`tab ${activeTab === "owe" ? "active" : ""}`} onClick={() => setActiveTab("owe")}>
          I Owe
        </button>
      </div>

      {activeTab === "owed" ? (
        <article className="panel">
          <div className="panel-head">
            <h2 className="page-title" style={{ fontSize: "1.3rem", margin: 0 }}>I'm Owed</h2>
          </div>
          {owedToMe.length === 0 ? (
            <EmptyState title="No receivables" subtitle="You currently have nothing pending from others." />
          ) : (
            owedToMe.map((row) => (
              <div key={row.expense._id} className="panel" style={{ marginBottom: "0.8rem" }}>
                <p><strong>{row.expense.title}</strong> • {formatCurrency(row.expense.amount)} • {formatDate(row.expense.date)}</p>
                <p className="small">Pending total: {formatCurrency(row.totalPending)}</p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Amount</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.pendingSplits.map((split) => (
                        <tr key={split._id}>
                          <td>{split.owedBy?.name || split.owedBy?._id}</td>
                          <td>{formatCurrency(split.amountOwed)}</td>
                          <td>
                            <button className="btn btn-ghost" type="button" onClick={() => onSettle(row.expense._id, split._id)}>
                              Mark Settled
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </article>
      ) : (
        <article className="panel">
          <div className="panel-head">
            <h2 className="page-title" style={{ fontSize: "1.3rem", margin: 0 }}>I Owe</h2>
          </div>
          {iOwe.length === 0 ? (
            <EmptyState title="No payables" subtitle="You don&apos;t owe anyone right now." />
          ) : (
            iOwe.map((row) => (
              <div key={row.expense._id} className="panel" style={{ marginBottom: "0.8rem" }}>
                <p>
                  <strong>{row.expense.title}</strong> • Pay to {row.expense.owner?.name || "Owner"} • {formatDate(row.expense.date)}
                </p>
                <p className="small">Pending total: {formatCurrency(row.totalPending)}</p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Amount</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.mySplits.map((split) => (
                        <tr key={split._id}>
                          <td>{formatCurrency(split.amountOwed)}</td>
                          <td>
                            <button className="btn btn-danger" type="button" onClick={() => onSettle(row.expense._id, split._id)}>
                              Settle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </article>
      )}
    </section>
  );
};

export default SharedPage;
