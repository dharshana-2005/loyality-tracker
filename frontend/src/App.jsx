import { useEffect, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import AddCustomer from "./pages/AddCustomer";
import AddPurchase from "./pages/AddPurchase";
import Login from "./pages/Login";
import "./App.css";

const AUTH_STORAGE_KEY = "crm_logged_in";

function ProtectedRoute({ isAuthenticated, children }) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("crm_theme") || "light");
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(AUTH_STORAGE_KEY) === "true"
  );

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("crm_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(AUTH_STORAGE_KEY, String(isAuthenticated));
  }, [isAuthenticated]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  const handleLogin = (username, password) => {
    const configuredUsername = (import.meta.env.VITE_LOGIN_USERNAME || "admin").trim();
    const configuredPassword = import.meta.env.VITE_LOGIN_PASSWORD || "admin123";

    if (username.trim() === configuredUsername && password === configuredPassword) {
      setIsAuthenticated(true);
      return { success: true };
    }

    return { success: false, message: "Invalid username or password." };
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="app-shell">
        <div className="app-backdrop" aria-hidden="true">
          <span className="bg-orb bg-orb-one" />
          <span className="bg-orb bg-orb-two" />
          <span className="bg-orb bg-orb-three" />
        </div>

        {isAuthenticated && (
          <Navbar theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} />
        )}

        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <main className="container">
                  <Dashboard />
                </main>
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-customer"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <main className="container">
                  <AddCustomer />
                </main>
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-purchase"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <main className="container">
                  <AddPurchase />
                </main>
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <main className="container login-container">
                  <Login onLogin={handleLogin} />
                </main>
              )
            }
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
