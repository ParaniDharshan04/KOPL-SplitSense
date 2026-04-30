// client/src/pages/BalancesPage.js
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { getIOwe, getOwedToMe } from "../services/expenseService";
import { parseApiError } from "../services/api";
import { formatCurrency } from "../utils/format";

const BalancesPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [iOweData, setIOweData] = useState([]);
  const [owedToMeData, setOwedToMeData] = useState([]);

  useEffect(() => {
    const loadBalances = async () => {
      try {
        setLoading(true);
        const [oweRes, owedRes] = await Promise.all([getIOwe(), getOwedToMe()]);
        setIOweData(oweRes.data.iOwe || []);
        setOwedToMeData(owedRes.data.owedToMe || []);
      } catch (error) {
        toast.error(parseApiError(error));
      } finally {
        setLoading(false);
      }
    };

    loadBalances();
  }, []);

  const derived = useMemo(() => {
    // Aggregate "You Owe" by person (expense owner)
    const youOweMap = new Map();
    iOweData.forEach((row) => {
      const owner = row.expense?.owner;
      if (!owner?._id) return;
      const ownerId = String(owner._id);
      const existing = youOweMap.get(ownerId);
      if (existing) {
        existing.amount += Number(row.totalPending || 0);
      } else {
        youOweMap.set(ownerId, {
          person: owner,
          amount: Number(row.totalPending || 0),
        });
      }
    });

    // Aggregate "Owed to You" by person (split owedBy)
    const owedToYouMap = new Map();
    owedToMeData.forEach((row) => {
      (row.pendingSplits || []).forEach((split) => {
        const debtor = split.owedBy;
        if (!debtor?._id) return;
        const debtorId = String(debtor._id);
        const existing = owedToYouMap.get(debtorId);
        if (existing) {
          existing.amount += Number(split.amountOwed || 0);
        } else {
          owedToYouMap.set(debtorId, {
            person: debtor,
            amount: Number(split.amountOwed || 0),
          });
        }
      });
    });

    const youOweList = Array.from(youOweMap.values()).filter((item) => item.amount > 0);
    const owedToYouList = Array.from(owedToYouMap.values()).filter((item) => item.amount > 0);

    const youOwe = youOweList.reduce((sum, item) => sum + item.amount, 0);
    const owedToYou = owedToYouList.reduce((sum, item) => sum + item.amount, 0);

    return {
      youOwe,
      owedToYou,
      net: owedToYou - youOwe,
      youOweList,
      owedToYouList,
    };
  }, [iOweData, owedToMeData]);

  if (loading) {
    return <LoadingSpinner text="Calculating balances..." />;
  }

  const youOweCount = derived.youOweList.length;
  const owedToYouCount = derived.owedToYouList.length;

  return (
    <section>
      <h1 className="page-title">Balances</h1>
      <p className="page-subtitle">Track what you owe and what you're owed</p>

      <div className="card-grid" style={{ marginBottom: "1.5rem" }}>
        <article className="balance-card">
          <div className="balance-head">
            <span className="balance-icon balance-icon--warn">↘</span>
            <span className="balance-label">You Owe</span>
          </div>
          <p className="balance-value balance-value--warn">{formatCurrency(derived.youOwe)}</p>
          <p className="small">{youOweCount} people</p>
        </article>
        <article className="balance-card">
          <div className="balance-head">
            <span className="balance-icon balance-icon--good">↗</span>
            <span className="balance-label">Owed to You</span>
          </div>
          <p className="balance-value balance-value--good">{formatCurrency(derived.owedToYou)}</p>
          <p className="small">{owedToYouCount} people</p>
        </article>
        <article className="balance-card">
          <div className="balance-head">
            <span className="balance-icon">↔</span>
            <span className="balance-label">Net Balance</span>
          </div>
          <p className="balance-value">
            {derived.net >= 0 ? "+" : ""}{formatCurrency(derived.net)}
          </p>
          <p className="small">{derived.net >= 0 ? "In your favor" : "You owe more"}</p>
        </article>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <article className="balance-panel">
          <div className="balance-panel-head balance-panel-head--warn">
            <h2>↘ You Owe</h2>
          </div>
          {derived.youOweList.length === 0 ? (
            <EmptyState title="All settled!" subtitle="You don't owe anyone." />
          ) : (
            <div className="balance-panel-body">
              {derived.youOweList.map((item, index) => (
                <div key={`${item.person?._id}-${index}`} className="balance-row">
                  <div className="balance-person">
                    <span className="balance-avatar">
                      {(item.person?.name || "U")
                        .split(" ")
                        .filter(Boolean)
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div>
                      <p className="balance-name">{item.person?.name || "Unknown"}</p>
                      <p className="small">Shared expense</p>
                    </div>
                  </div>
                  <p className="balance-amount balance-amount--warn">{formatCurrency(item.amount)}</p>
                  <Link className="balance-action balance-action--warn" to="/shared?tab=owe">
                    Settle Up
                  </Link>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="balance-panel">
          <div className="balance-panel-head balance-panel-head--good">
            <h2>↗ Owed to You</h2>
          </div>
          {derived.owedToYouList.length === 0 ? (
            <EmptyState title="No outstanding debts" subtitle="Nobody owes you money." />
          ) : (
            <div className="balance-panel-body">
              {derived.owedToYouList.map((item, index) => (
                <div key={`${item.person?._id}-${index}`} className="balance-row">
                  <div className="balance-person">
                    <span className="balance-avatar">
                      {(item.person?.name || "U")
                        .split(" ")
                        .filter(Boolean)
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div>
                      <p className="balance-name">{item.person?.name || "Unknown"}</p>
                      <p className="small">Shared expense</p>
                    </div>
                  </div>
                  <p className="balance-amount balance-amount--good">+{formatCurrency(item.amount)}</p>
                  <Link className="balance-action balance-action--good" to="/shared">
                    Mark settled
                  </Link>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
};

export default BalancesPage;
