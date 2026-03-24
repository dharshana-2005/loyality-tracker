import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import AddCustomer from "./pages/AddCustomer";
import AddPurchase from "./pages/AddPurchase";
import "./App.css";

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("crm_theme") || "light");

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("crm_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  return (
    <Router>
      <div className="app-shell">
        <div className="app-backdrop" aria-hidden="true">
          <span className="bg-orb bg-orb-one" />
          <span className="bg-orb bg-orb-two" />
          <span className="bg-orb bg-orb-three" />
        </div>

        <Navbar theme={theme} onToggleTheme={toggleTheme} />

        <Routes>
          <Route
            path="/"
            element={
              <main className="container">
                <Dashboard />
              </main>
            }
          />
          <Route
            path="/add-customer"
            element={
              <main className="container">
                <AddCustomer />
              </main>
            }
          />
          <Route
            path="/add-purchase"
            element={
              <main className="container">
                <AddPurchase />
              </main>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
