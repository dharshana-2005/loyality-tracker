import { useState } from "react";
import apiClient from "../api/client";

function AddPurchase() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [preview, setPreview] = useState(null);
  const [showPaymentQr, setShowPaymentQr] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const formatAmount = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
  };

  const buildQrImageUrl = (previewData) => {
    const qrText = [
      "SMART RETAIL LOYALTY PAYMENT",
      `Customer: ${previewData.customerName}`,
      `Phone: ${previewData.phoneNumber}`,
      `Final Amount: Rs ${formatAmount(previewData.finalAmount)}`,
    ].join("\n");

    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
      qrText
    )}`;
  };

  const validatePayload = () => {
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid purchase amount.");
      return null;
    }

    if (!phoneNumber.trim()) {
      setError("Please enter a phone number.");
      return null;
    }

    return {
      phoneNumber: phoneNumber.trim(),
      amount: parsedAmount,
    };
  };

  const handleApiError = (requestError) => {
    const statusCode = requestError?.response?.status;
    const errorPath = requestError?.response?.data?.path;
    const apiMessage =
      requestError?.response?.data?.message || requestError?.response?.data?.error;

    if (statusCode === 404) {
      if (errorPath === "/purchases/discount-preview") {
        setError("Backend update not loaded. Please restart backend and try again.");
      } else {
        setError("No customer found for this phone number.");
      }
    } else if (statusCode === 409) {
      setError("Multiple customers found with this phone number.");
    } else if (statusCode === 400) {
      setError(apiMessage || "Invalid phone number or amount.");
    } else {
      setError(apiMessage || "Unable to process purchase right now.");
    }
  };

  const handlePredictDiscount = async () => {
    const payload = validatePayload();
    if (!payload) {
      setMessage("");
      setPreview(null);
      setShowPaymentQr(false);
      return;
    }

    setError("");
    setMessage("");
    setShowPaymentQr(false);
    setIsPredicting(true);

    try {
      const response = await apiClient.post("/purchases/discount-preview", payload);
      const previewData = response.data;

      setPreview(previewData);
      setMessage("Discount details ready. Click Pay Now to show QR.");
    } catch (requestError) {
      setPreview(null);
      setShowPaymentQr(false);
      handleApiError(requestError);
    } finally {
      setIsPredicting(false);
    }
  };

  const handlePayNow = () => {
    if (!preview) {
      setError("Please click Predict Discount first.");
      return;
    }

    setError("");
    setMessage("Show this QR to customer for payment.");
    setShowPaymentQr(true);
  };

  const handleSubmit = async () => {
    const payload = validatePayload();
    if (!payload) {
      setMessage("");
      setPreview(null);
      return;
    }

    if (!preview) {
      setMessage("");
      setError("Please click Predict Discount before adding purchase.");
      return;
    }

    if (!Number.isFinite(Number(preview.originalCost))) {
      setMessage("");
      setError("Preview original cost is missing. Please predict again.");
      return;
    }

    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const response = await apiClient.post("/purchases", {
        ...payload,
        originalCost: Number(preview.originalCost),
      });
      const purchaseData = response.data;

      setMessage(
        `Purchase added. Final amount charged is Rs ${formatAmount(
          purchaseData.finalAmount
        )} after ${formatAmount(
          purchaseData.discountPercent
        )}% discount. Profit after discount is Rs ${formatAmount(
          purchaseData.netProfitAfterDiscount
        )}.`
      );
      setAmount("");
      setPreview(null);
      setShowPaymentQr(false);
    } catch (requestError) {
      handleApiError(requestError);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="page-panel">
      <header className="panel-header">
        <p className="eyebrow">Purchases</p>
        <h2 className="panel-title">Add Purchase</h2>
        <p className="panel-subtitle">
          Enter phone and amount, predict discount, then confirm purchase.
        </p>
      </header>

      <div className="form-field">
        <label htmlFor="purchase-phone-number">Phone Number</label>
        <input
          id="purchase-phone-number"
          type="text"
          placeholder="Enter customer phone number"
          value={phoneNumber}
          onChange={(event) => {
            setPhoneNumber(event.target.value);
            setPreview(null);
            setShowPaymentQr(false);
            setError("");
            setMessage("");
          }}
        />
      </div>

      <div className="form-field">
        <label htmlFor="purchase-amount">Purchase Amount</label>
        <input
          id="purchase-amount"
          type="number"
          placeholder="Enter selling amount"
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
            setPreview(null);
            setShowPaymentQr(false);
            setError("");
            setMessage("");
          }}
        />
      </div>

      <div className="action-row">
        <button
          className="secondary-button"
          onClick={handlePredictDiscount}
          disabled={isPredicting || isSaving}
        >
          {isPredicting ? "Predicting..." : "Predict Discount"}
        </button>
        <button onClick={handlePayNow} disabled={isSaving || isPredicting || !preview}>
          {showPaymentQr ? "QR Ready" : "Pay Now"}
        </button>
      </div>

      {preview && !showPaymentQr && (
        <div className="prediction-card">
          <p className="prediction-title">Discount Details</p>
          <div className="prediction-grid">
            <p>Customer: {preview.customerName}</p>
            <p>Phone: {preview.phoneNumber}</p>
            <p>Total Purchases: {preview.totalPurchases}</p>
            <p>Segment: {preview.customerSegment}</p>
            <p>Loyalty Score: {formatAmount(preview.loyaltyScore)}</p>
            <p>Selling Amount: Rs {formatAmount(preview.originalAmount)}</p>
            <p>Original Cost: Rs {formatAmount(preview.originalCost)}</p>
            <p>Profit After Discount: Rs {formatAmount(preview.netProfitAfterDiscount)}</p>
            <p>General Discount Limit: {formatAmount(preview.profitSafeMaxDiscountPercent)}%</p>
            <p>Cost-Based Discount Limit: {formatAmount(preview.profitBasedMaxDiscountPercent)}%</p>
            <p>Final Amount: Rs {formatAmount(preview.finalAmount)}</p>
            <p>Profit Guard Applied: {preview.marginGuardApplied ? "Yes" : "No"}</p>
          </div>
        </div>
      )}

      {preview && showPaymentQr && (
        <div className="prediction-card">
          <p className="prediction-title">Customer Payment QR</p>
          <div className="qr-block">
            <img
              className="qr-image"
              src={buildQrImageUrl(preview)}
              alt="Customer payment QR"
            />
            <p className="final-amount-text">
              Final Amount: <strong>Rs {formatAmount(preview.finalAmount)}</strong>
            </p>
            <button onClick={handleSubmit} disabled={isSaving || isPredicting}>
              {isSaving ? "Saving..." : "Confirm Purchase"}
            </button>
          </div>
        </div>
      )}

      {message && <p className="status-text status-success">{message}</p>}
      {error && <p className="status-text status-error">{error}</p>}
    </section>
  );
}

export default AddPurchase;
