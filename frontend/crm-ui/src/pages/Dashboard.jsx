import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import heroDashboardIllustration from "../assets/hero-ai-dashboard.svg";

function AnimatedNumber({ value, formatter, duration = 900 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const endValue = Number(value);
    if (!Number.isFinite(endValue)) {
      setDisplayValue(0);
      return;
    }

    let frameId;
    const start = performance.now();

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(endValue * easedProgress);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return formatter(displayValue);
}

const formatAmount = (value) =>
  `Rs ${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatNumber = (value) => Math.round(value).toLocaleString("en-IN");

const formatScore = (value) =>
  Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) {
    return "No purchases yet";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const resolveTier = (loyaltyScore, loyaltyThreshold) => {
  const threshold = Math.max(Number(loyaltyThreshold) || 1, 1);
  const ratio = (Number(loyaltyScore) || 0) / threshold;

  if (ratio >= 1.8) {
    return {
      label: "Platinum",
      className: "tier-platinum",
      description: "Top-value customer with strong repeat behavior.",
    };
  }

  if (ratio >= 1.2) {
    return {
      label: "Gold",
      className: "tier-gold",
      description: "High engagement customer with clear growth potential.",
    };
  }

  if (ratio >= 0.8) {
    return {
      label: "Silver",
      className: "tier-silver",
      description: "Steady customer, ideal for bundle and upsell campaigns.",
    };
  }

  return {
    label: "At Risk",
    className: "tier-risk",
    description: "Low engagement detected; prioritize win-back actions immediately.",
  };
};

const buildAiInsight = (summary, tier) => {
  const purchases = Number(summary.totalPurchases) || 0;
  const totalSpend = Number(summary.totalAmountSpent) || 0;
  const isEligible = Boolean(summary.eligibleForDiscount);

  if (tier.label === "Platinum" && isEligible) {
    return {
      title: "VIP retention window is open",
      message: "Launch a premium reward this week to lock in repeat high-ticket purchases.",
      tags: ["High CLV", "Low churn risk", "Cross-sell ready"],
    };
  }

  if (isEligible) {
    return {
      title: "Discount-ready high intent customer",
      message: "Use a controlled reward plus curated products to improve basket size.",
      tags: ["Reward eligible", "Upsell candidate", "Stable frequency"],
    };
  }

  if (purchases <= 2) {
    return {
      title: "At-risk loyalty pattern detected",
      message: "Trigger onboarding nudges and low-friction offers before inactivity increases.",
      tags: ["At Risk", "Needs activation", "Retention urgent"],
    };
  }

  if (totalSpend > 0) {
    return {
      title: "Mid-tier loyalty growth opportunity",
      message: "Use targeted reminders and spend-linked perks to reach discount eligibility.",
      tags: ["Near threshold", "Retention focus", "Value growth"],
    };
  }

  return {
    title: "Data insufficient for strong prediction",
    message: "Capture a few more purchases to improve AI confidence and action quality.",
    tags: ["Low history", "Collect behavior", "Monitor next visits"],
  };
};

function Dashboard() {
  const [customerId, setCustomerId] = useState("");
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  const fetchSummary = async () => {
    if (!customerId.trim()) {
      setError("Please enter a customer ID.");
      setSummary(null);
      return;
    }

    setError("");
    setIsLoading(true);
    setHasRequested(true);

    try {
      const response = await apiClient.get(`/customers/${customerId}/summary`);
      setSummary(response.data);
    } catch (requestError) {
      setSummary(null);
      setError("Customer not found or the server is unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    fetchSummary();
  };

  const stats = useMemo(() => {
    if (!summary) {
      return [];
    }

    return [
      {
        label: "Total Purchases",
        note: "Transactions captured in CRM",
        value: Number(summary.totalPurchases) || 0,
        formatter: formatNumber,
      },
      {
        label: "Total Revenue",
        note: "Cumulative value from this customer",
        value: Number(summary.totalAmountSpent) || 0,
        formatter: formatAmount,
      },
      {
        label: "Loyalty Score",
        note: "Behavior-weighted engagement signal",
        value: Number(summary.loyaltyScore) || 0,
        formatter: formatScore,
      },
      {
        label: "Loyalty Threshold",
        note: "Target score for stronger rewards",
        value: Number(summary.loyaltyThreshold) || 0,
        formatter: formatScore,
      },
    ];
  }, [summary]);

  const loyaltyTier = useMemo(() => {
    if (!summary) {
      return null;
    }

    return resolveTier(summary.loyaltyScore, summary.loyaltyThreshold);
  }, [summary]);

  const insight = useMemo(() => {
    if (!summary || !loyaltyTier) {
      return null;
    }

    return buildAiInsight(summary, loyaltyTier);
  }, [summary, loyaltyTier]);

  const retentionProjection = useMemo(() => {
    if (!summary) {
      return 68;
    }

    const score = Number(summary.loyaltyScore) || 0;
    return Math.max(54, Math.min(97, Math.round(60 + score / 14)));
  }, [summary]);

  const scrollToAnalytics = () => {
    const analyticsPanel = document.getElementById("analytics-panel");
    analyticsPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="dashboard-layout">
      <div className="dashboard-shapes" aria-hidden="true">
        <span className="dashboard-shape shape-one" />
        <span className="dashboard-shape shape-two" />
        <span className="dashboard-shape shape-three" />
      </div>

      <article className="hero-banner glass-card">
        <div className="hero-content">
          <p className="eyebrow">Dashboard</p>
          <h2 className="hero-title">Premium Loyalty Intelligence for Smart Retail Growth</h2>
          <p className="hero-subtitle">
            Run customer analytics, identify loyalty tiers, and convert insights into high-margin
            retention actions from one premium workspace.
          </p>

          <div className="hero-cta-row">
            <button type="button" className="hero-primary-cta" onClick={scrollToAnalytics}>
              Explore AI Analytics
            </button>
          </div>

          <form className="hero-form" onSubmit={handleSubmit}>
            <label htmlFor="customer-id">Customer ID</label>
            <div className="hero-input-row">
              <input
                id="customer-id"
                type="number"
                placeholder="Enter customer ID"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
              />
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Loading..." : "View Analytics"}
              </button>
            </div>
          </form>

          {error && <p className="status-text status-error">{error}</p>}

          {summary && loyaltyTier && (
            <div className="hero-chip-row">
              <span className={`tier-badge ${loyaltyTier.className}`}>{loyaltyTier.label}</span>
              <span
                className={`eligibility-pill ${
                  summary.eligibleForDiscount ? "eligible" : "not-eligible"
                }`}
              >
                {summary.eligibleForDiscount ? "Discount Eligible" : "Not Eligible"}
              </span>
              <span className="hero-meta-chip">Last Purchase: {formatDate(summary.lastPurchaseDate)}</span>
            </div>
          )}
        </div>

        <div className="hero-media">
          <img src={heroDashboardIllustration} alt="AI analytics workspace visualization" />
          <div className="hero-media-card">
            <p>Projected Retention</p>
            <strong>{retentionProjection}%</strong>
          </div>
          <div className="hero-media-chip hero-media-chip-top">Real-time CRM View</div>
          <div className="hero-media-chip hero-media-chip-bottom">AI driven loyalty actions</div>
        </div>
      </article>

      {isLoading && (
        <article className="loading-card glass-card">
          <span className="loading-spinner" aria-hidden="true" />
          <p>Fetching customer analytics...</p>
        </article>
      )}

      {!isLoading && summary && loyaltyTier && insight && (
        <>
          <section className="analytics-grid" id="analytics-panel">
            {stats.map((stat) => (
              <article className="analytics-card glass-card" key={stat.label}>
                <p className="analytics-label">{stat.label}</p>
                <p className="analytics-value">
                  <AnimatedNumber value={stat.value} formatter={stat.formatter} />
                </p>
                <p className="analytics-note">{stat.note}</p>
              </article>
            ))}

            <article className="analytics-card loyalty-card glass-card">
              <p className="analytics-label">Loyalty Tier</p>
              <div className="tier-row">
                <span className={`tier-badge ${loyaltyTier.className}`}>{loyaltyTier.label}</span>
                <span
                  className={`eligibility-pill ${
                    summary.eligibleForDiscount ? "eligible" : "not-eligible"
                  }`}
                >
                  {summary.eligibleForDiscount ? "Eligible" : "Not Eligible"}
                </span>
              </div>
              <p className="analytics-note">{loyaltyTier.description}</p>
              <p className="mini-metric">Last Purchase: {formatDate(summary.lastPurchaseDate)}</p>
            </article>
          </section>

          <section className="insight-grid">
            <article className="insight-card glass-card">
              <p className="analytics-label">AI Insights</p>
              <h3>{insight.title}</h3>
              <p>{insight.message}</p>
              <div className="insight-tags">
                {insight.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          </section>
        </>
      )}

      {!isLoading && !summary && (
        <article className="empty-state glass-card">
          <h3>{hasRequested ? "No customer data available" : "Customer analytics will appear here"}</h3>
          <p>
            {hasRequested
              ? "Verify the customer ID and try again."
              : "Search by customer ID to view revenue, loyalty tier, and AI recommendations."}
          </p>
        </article>
      )}
    </section>
  );
}

export default Dashboard;
