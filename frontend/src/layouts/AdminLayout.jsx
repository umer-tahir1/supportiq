import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronRight,
  LayoutDashboard,
  Layers3,
  LogOut,
  Menu,
  Search,
  Ticket,
  X,
} from "lucide-react";
import { Brand, LoadState } from "../components/Common";
import { getCurrentAdmin, getToken, logout } from "../services/api";

const links = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/tickets", label: "Tickets", icon: Ticket },
  { to: "/admin/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { to: "/admin/clusters", label: "Clusters", icon: Layers3 },
  { to: "/admin/similar", label: "Similar Cases", icon: Search },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    function expired() {
      navigate("/admin/login", { replace: true });
    }
    window.addEventListener("supportiq:expired", expired);
    if (!getToken()) expired();
    else
      getCurrentAdmin()
        .then(setAdmin)
        .catch((error) => setError(error.message));
    return () => window.removeEventListener("supportiq:expired", expired);
  }, [navigate]);
  useEffect(() => {
    setMenu(false);
  }, [location.pathname]);
  const active = links.find((link) =>
    link.end
      ? location.pathname === link.to
      : location.pathname.startsWith(link.to),
  );
  if (!admin)
    return (
      <LoadState
        loading={!error}
        error={error}
        reload={() => window.location.reload()}
      />
    );
  return (
    <div className="admin-shell">
      {menu && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <Brand admin />
          <button
            className="icon-button mobile-close"
            aria-label="Close navigation"
            onClick={() => setMenu(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="organization">
          <span className="organization-avatar">U</span>
          <div>
            <strong>UrbanBite Foods</strong>
            <small>Customer experience</small>
          </div>
          <span className="org-dot" />
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="intelligence-card">
            <span className="tiny-line" />
            <strong>Feedback into focus.</strong>
            <p>
              Real complaints.
              <br />
              More informed decisions.
            </p>
            <NavLink to="/admin/analytics">
              Explore your insights
              <ArrowUpRight size={15} />
            </NavLink>
          </div>
          <div className="admin-account">
            <span className="account-avatar">AD</span>
            <div>
              <strong>Administrator</strong>
              <small title={admin.email}>{admin.email}</small>
            </div>
            <button
              className="icon-button"
              aria-label="Log out"
              onClick={() => {
                logout();
                navigate("/admin/login");
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="admin-body">
        <header className="admin-topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{active?.label || "Ticket details"}</strong>
          </div>
          <span className="workspace-status">
            <span className="live-dot" />
            Private workspace
          </span>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
        <footer className="admin-footer">
          <span>
            SupportIQ <span className="muted">/ Customer intelligence</span>
          </span>
          <span>UrbanBite Foods</span>
        </footer>
      </div>
    </div>
  );
}
