import { useState } from "react";
import apiClient from "../api/client";

function AddCustomer() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      setMessage("");
      setError("Name and phone are required.");
      return;
    }

    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      await apiClient.post("/customers", {
        name,
        phone,
      });

      setMessage("Customer added successfully.");
      setName("");
      setPhone("");
    } catch (requestError) {
      setError("Unable to add customer. Please check backend connection.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="page-panel">
      <header className="panel-header">
        <p className="eyebrow">Customers</p>
        <h2 className="panel-title">Add New Customer</h2>
        <p className="panel-subtitle">Create a customer profile before logging purchases.</p>
      </header>

      <div className="form-field">
        <label htmlFor="customer-name">Customer Name</label>
        <input
          id="customer-name"
          type="text"
          placeholder="Enter customer name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="customer-phone">Phone Number</label>
        <input
          id="customer-phone"
          type="text"
          placeholder="Enter phone number"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>

      <button onClick={handleSubmit} disabled={isSaving}>
        {isSaving ? "Saving..." : "Add Customer"}
      </button>

      {message && <p className="status-text status-success">{message}</p>}
      {error && <p className="status-text status-error">{error}</p>}
    </section>
  );
}

export default AddCustomer;
