import { NavLink } from "react-router-dom";

function Navbar({ theme, onToggleTheme }) {
  const isDark = theme === "dark";

  return (
    <nav className="navbar">
      <div className="brand-block">
        <p className="brand-tag">Loyalty Tracker</p>
        <h1 className="brand-title">Smart Retail CRM</h1>
      </div>

      <div className="nav-actions">
        <div className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/add-customer"
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            Add Customer
          </NavLink>
          <NavLink
            to="/add-purchase"
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            Add Purchase
          </NavLink>
        </div>

        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
          <span className={`toggle-track ${isDark ? "toggle-track-dark" : ""}`}>
            <span className="toggle-thumb" />
          </span>
          <span className="toggle-text">{isDark ? "Dark" : "Light"} mode</span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
