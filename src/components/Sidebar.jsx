import { NavLink, useNavigate } from "react-router-dom";

const menuItems = [
  { path: "/app", icon: "/assets/dashboard.png", label: "Dashboard", end: true },
  { path: "/app/projects", icon: "/assets/folder.png", label: "Projects" },
  { path: "/app/tasks", icon: "/assets/check.png", label: "My Tasks" },
  { path: "/app/calendar", icon: "/assets/calendar.png", label: "Calendar" },
  { path: "/app/meet", icon: "/assets/meet.png", label: "Meet", key: "meet" },
  { path: "/app/teams", icon: "/assets/group.png", label: "Teams" },
  { path: "/app/reports", icon: "/assets/reports.png", label: "Reports" },
  { path: "/app/settings", icon: "/assets/setting.png", label: "Settings" },
];

function Sidebar({ workspaceName, unreadCount, hasMultipleWorkspaces, onSwitchClick }) {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Skyline</h1>
        {workspaceName && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <p style={{ fontSize: 11, color: "#8b8fa3", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{workspaceName}</p>
            {hasMultipleWorkspaces && (
              <button onClick={onSwitchClick} style={{ background: "none", border: "none", color: "#667eea", fontSize: 10, cursor: "pointer", padding: "2px 4px" }} title="Switch workspace">⇄</button>
            )}
          </div>
        )}
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.end} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <span className="sidebar-icon">
              {item.icon.startsWith("/") ? (
                <img src={item.icon} alt={item.label} className="sidebar-icon-img" />
              ) : (
                item.icon
              )}
            </span>
            <span>{item.label}</span>
            {item.key === "meet" && unreadCount > 0 && (
              <span className="sidebar-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="sidebar-logout" onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}>
           Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
