import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getProjects } from "../services/api";

function Dashboard() {
  const { user } = useOutletContext();
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, completed: 0 });
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    getProjects().then((res) => {
      const projects = res.data;
      setRecentProjects(projects.slice(0, 5));
      setStats({
        total: projects.length,
        active: projects.filter((p) => p.status === "active").length,
        pending: projects.filter((p) => p.status === "pending").length,
        completed: projects.filter((p) => p.status === "completed").length,
      });
    });
  }, []);

  return (
    <div className="dashboard-page">
      <h2 className="page-title">Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Projects</div>
        </div>
        <div className="stat-card stat-active">
          <div className="stat-number">{stats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card stat-pending">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card stat-completed">
          <div className="stat-number">{stats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="recent-section">
        <h3>Recent Projects</h3>
        {recentProjects.length === 0 ? (
          <p className="empty-text">No projects yet. Create your first one!</p>
        ) : (
          <div className="recent-list">
            {recentProjects.map((project) => (
              <div key={project._id} className="recent-item">
                <div className="recent-color" style={{ background: project.color }} />
                <div className="recent-info">
                  <span className="recent-name">{project.name}</span>
                  <span className={`badge badge-${project.status}`}>{project.status}</span>
                </div>
                <div className="recent-progress">
                  <div className="mini-progress">
                    <div className="mini-fill" style={{ width: `${project.progress}%`, background: project.color }} />
                  </div>
                  <span>{project.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
