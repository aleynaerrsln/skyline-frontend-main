import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getProjects, getAllTasks, getTeamMembers } from "../services/api";
import { hasPerm } from "../utils/permissions";

const STATUS_LABELS = {
  backlog: "Backlog", todo: "To Do", in_progress: "In Progress",
  in_review: "In Review", done: "Done",
};
const STATUS_COLORS = {
  backlog: "#8b8fa3", todo: "#4facfe", in_progress: "#fee140",
  in_review: "#a882ff", done: "#43e97b",
};
const PRIORITY_COLORS = { low: "#43e97b", medium: "#fee140", high: "#ff6b6b" };
const PROJECT_STATUS_COLORS = {
  active: "#4facfe", pending: "#fee140", completed: "#43e97b", archived: "#8b8fa3",
};

function BarChart({ data, maxVal }) {
  const max = maxVal || Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="report-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="report-bar-item">
          <div className="report-bar-label">{d.label}</div>
          <div className="report-bar-track">
            <div
              className="report-bar-fill"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color || "#667eea" }}
            />
          </div>
          <div className="report-bar-value">{d.value}</div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments, total, label }) {
  let cumulative = 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="report-donut-wrapper">
      <svg viewBox="0 0 128 128" className="report-donut-svg">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#21232d" strokeWidth="14" />
        {segments.map((seg, i) => {
          const pct = total > 0 ? seg.value / total : 0;
          const offset = circumference * (1 - cumulative / (total || 1));
          cumulative += seg.value;
          return (
            <circle
              key={i}
              cx="64" cy="64" r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${circumference * pct} ${circumference * (1 - pct)}`}
              strokeDashoffset={offset}
              transform="rotate(-90 64 64)"
              style={{ transition: "all 0.5s" }}
            />
          );
        })}
      </svg>
      <div className="report-donut-center">
        <span className="report-donut-total">{total}</span>
        <span className="report-donut-label">{label}</span>
      </div>
    </div>
  );
}

function Reports() {
  const { user } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [projRes, taskRes, teamRes] = await Promise.all([
          getProjects(), getAllTasks(), getTeamMembers(),
        ]);
        setProjects(projRes.data);
        setTasks(taskRes.data);
        setMembers(teamRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (!hasPerm(user, "rapor_goruntule")) {
    return (
      <div className="placeholder-page">
        <h2 className="page-title">Reports</h2>
        <div className="placeholder-card">
          <p>You don't have permission to view reports.</p>
        </div>
      </div>
    );
  }

  if (loading) return <p className="empty-text">Loading...</p>;

  // ==================== CALCULATIONS ====================
  const totalTasks = tasks.length;
  const totalProjects = projects.length;
  const totalMembers = members.length;

  // Task status counts
  const taskStatusCounts = {};
  Object.keys(STATUS_LABELS).forEach((s) => { taskStatusCounts[s] = 0; });
  tasks.forEach((t) => { taskStatusCounts[t.status] = (taskStatusCounts[t.status] || 0) + 1; });

  const completedTasks = taskStatusCounts.done || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Priority counts
  const priorityCounts = { low: 0, medium: 0, high: 0 };
  tasks.forEach((t) => { priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1; });

  // Project status counts
  const projectStatusCounts = { active: 0, pending: 0, completed: 0, archived: 0 };
  projects.forEach((p) => { projectStatusCounts[p.status] = (projectStatusCounts[p.status] || 0) + 1; });

  // Tasks per project
  const tasksPerProject = {};
  tasks.forEach((t) => {
    const pName = t.project?.name || "Unknown";
    const pColor = t.project?.color || "#667eea";
    if (!tasksPerProject[pName]) tasksPerProject[pName] = { count: 0, done: 0, color: pColor };
    tasksPerProject[pName].count++;
    if (t.status === "done") tasksPerProject[pName].done++;
  });

  // Member workload — tasks assigned per member
  const memberWorkload = {};
  tasks.forEach((t) => {
    t.assignees?.forEach((a) => {
      const name = `${a.name} ${a.surname || ""}`.trim();
      if (!memberWorkload[name]) memberWorkload[name] = { total: 0, done: 0 };
      memberWorkload[name].total++;
      if (t.status === "done") memberWorkload[name].done++;
    });
  });

  // Overdue tasks
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const overdueTasks = tasks.filter((t) => t.status !== "done" && t.endDate && new Date(t.endDate) < now);

  // Upcoming deadlines (next 7 days)
  const in7Days = new Date(now); in7Days.setDate(in7Days.getDate() + 7);
  const upcomingTasks = tasks.filter((t) => {
    if (t.status === "done" || !t.endDate) return false;
    const end = new Date(t.endDate);
    return end >= now && end <= in7Days;
  }).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

  return (
    <div className="reports-page">
      <h2 className="page-title">Reports & Analytics</h2>

      {/* Overview Stats */}
      <div className="report-stats-grid">
        <div className="report-stat-card">
          <div className="report-stat-number">{totalProjects}</div>
          <div className="report-stat-label">Projects</div>
        </div>
        <div className="report-stat-card">
          <div className="report-stat-number">{totalTasks}</div>
          <div className="report-stat-label">Total Tasks</div>
        </div>
        <div className="report-stat-card">
          <div className="report-stat-number" style={{ color: "#43e97b" }}>{completionRate}%</div>
          <div className="report-stat-label">Completion Rate</div>
        </div>
        <div className="report-stat-card">
          <div className="report-stat-number" style={{ color: overdueTasks.length > 0 ? "#ff6b6b" : "#43e97b" }}>{overdueTasks.length}</div>
          <div className="report-stat-label">Overdue</div>
        </div>
        <div className="report-stat-card">
          <div className="report-stat-number">{totalMembers}</div>
          <div className="report-stat-label">Team Members</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="report-charts-row">
        {/* Task Status Donut */}
        <div className="report-card">
          <h3 className="report-card-title">Task Status</h3>
          <div className="report-donut-container">
            <DonutChart
              segments={Object.keys(STATUS_LABELS).map((s) => ({ value: taskStatusCounts[s], color: STATUS_COLORS[s] }))}
              total={totalTasks}
              label="Tasks"
            />
            <div className="report-legend">
              {Object.keys(STATUS_LABELS).map((s) => (
                <div key={s} className="report-legend-item">
                  <div className="report-legend-dot" style={{ background: STATUS_COLORS[s] }} />
                  <span className="report-legend-label">{STATUS_LABELS[s]}</span>
                  <span className="report-legend-value">{taskStatusCounts[s]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Donut */}
        <div className="report-card">
          <h3 className="report-card-title">Priority Distribution</h3>
          <div className="report-donut-container">
            <DonutChart
              segments={["low", "medium", "high"].map((p) => ({ value: priorityCounts[p], color: PRIORITY_COLORS[p] }))}
              total={totalTasks}
              label="Tasks"
            />
            <div className="report-legend">
              {["low", "medium", "high"].map((p) => (
                <div key={p} className="report-legend-item">
                  <div className="report-legend-dot" style={{ background: PRIORITY_COLORS[p] }} />
                  <span className="report-legend-label" style={{ textTransform: "capitalize" }}>{p}</span>
                  <span className="report-legend-value">{priorityCounts[p]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Project Status Donut */}
        <div className="report-card">
          <h3 className="report-card-title">Project Status</h3>
          <div className="report-donut-container">
            <DonutChart
              segments={["active", "pending", "completed", "archived"].map((s) => ({ value: projectStatusCounts[s], color: PROJECT_STATUS_COLORS[s] }))}
              total={totalProjects}
              label="Projects"
            />
            <div className="report-legend">
              {["active", "pending", "completed", "archived"].map((s) => (
                <div key={s} className="report-legend-item">
                  <div className="report-legend-dot" style={{ background: PROJECT_STATUS_COLORS[s] }} />
                  <span className="report-legend-label" style={{ textTransform: "capitalize" }}>{s}</span>
                  <span className="report-legend-value">{projectStatusCounts[s]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bar Charts Row */}
      <div className="report-charts-row two-col">
        {/* Tasks per Project */}
        <div className="report-card">
          <h3 className="report-card-title">Tasks per Project</h3>
          {Object.keys(tasksPerProject).length === 0 ? (
            <p style={{ color: "#555", fontSize: 14 }}>No data</p>
          ) : (
            <BarChart
              data={Object.entries(tasksPerProject).map(([name, d]) => ({
                label: name, value: d.count, color: d.color,
              }))}
            />
          )}
        </div>

        {/* Member Workload */}
        <div className="report-card">
          <h3 className="report-card-title">Member Workload</h3>
          {Object.keys(memberWorkload).length === 0 ? (
            <p style={{ color: "#555", fontSize: 14 }}>No data</p>
          ) : (
            <BarChart
              data={Object.entries(memberWorkload)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([name, d]) => ({
                  label: name, value: d.total, color: "#667eea",
                }))}
            />
          )}
        </div>
      </div>

      {/* Completion per Project */}
      <div className="report-card" style={{ marginBottom: 24 }}>
        <h3 className="report-card-title">Project Completion</h3>
        <div className="report-completion-list">
          {Object.entries(tasksPerProject).map(([name, d]) => {
            const pct = d.count > 0 ? Math.round((d.done / d.count) * 100) : 0;
            return (
              <div key={name} className="report-completion-item">
                <div className="report-completion-info">
                  <div className="report-completion-dot" style={{ background: d.color }} />
                  <span className="report-completion-name">{name}</span>
                  <span className="report-completion-fraction">{d.done}/{d.count} done</span>
                </div>
                <div className="report-completion-bar">
                  <div className="report-completion-fill" style={{ width: `${pct}%`, background: d.color }} />
                </div>
                <span className="report-completion-pct">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Overdue + Upcoming */}
      <div className="report-charts-row two-col">
        {/* Overdue */}
        <div className="report-card">
          <h3 className="report-card-title" style={{ color: overdueTasks.length > 0 ? "#ff6b6b" : "#fff" }}>
            Overdue Tasks ({overdueTasks.length})
          </h3>
          {overdueTasks.length === 0 ? (
            <p style={{ color: "#43e97b", fontSize: 14 }}>No overdue tasks!</p>
          ) : (
            <div className="report-task-list">
              {overdueTasks.slice(0, 8).map((t) => {
                const daysOver = Math.ceil((now - new Date(t.endDate)) / (1000 * 60 * 60 * 24));
                return (
                  <div key={t._id} className="report-task-item overdue">
                    <div className="report-task-item-info">
                      <span className="report-task-item-title">{t.title}</span>
                      <span className="report-task-item-meta">{t.project?.name}</span>
                    </div>
                    <span className="report-task-item-badge" style={{ background: "rgba(255,107,107,0.12)", color: "#ff6b6b" }}>
                      {daysOver}d overdue
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="report-card">
          <h3 className="report-card-title">Upcoming Deadlines (7 days)</h3>
          {upcomingTasks.length === 0 ? (
            <p style={{ color: "#555", fontSize: 14 }}>No upcoming deadlines</p>
          ) : (
            <div className="report-task-list">
              {upcomingTasks.slice(0, 8).map((t) => {
                const daysLeft = Math.ceil((new Date(t.endDate) - now) / (1000 * 60 * 60 * 24));
                return (
                  <div key={t._id} className="report-task-item">
                    <div className="report-task-item-info">
                      <span className="report-task-item-title">{t.title}</span>
                      <span className="report-task-item-meta">{t.project?.name}</span>
                    </div>
                    <span className="report-task-item-badge" style={{
                      background: daysLeft <= 1 ? "rgba(255,107,107,0.12)" : daysLeft <= 3 ? "rgba(255,165,2,0.12)" : "rgba(67,233,123,0.12)",
                      color: daysLeft <= 1 ? "#ff6b6b" : daysLeft <= 3 ? "#ffa502" : "#43e97b",
                    }}>
                      {daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d left`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Member Performance Table */}
      <div className="report-card">
        <h3 className="report-card-title">Member Performance</h3>
        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Assigned</th>
                <th>Completed</th>
                <th>Completion %</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(memberWorkload)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([name, d]) => {
                  const pct = d.total > 0 ? Math.round((d.done / d.total) * 100) : 0;
                  return (
                    <tr key={name}>
                      <td style={{ fontWeight: 600, color: "#e1e4e8" }}>{name}</td>
                      <td>{d.total}</td>
                      <td>{d.done}</td>
                      <td style={{ color: pct >= 70 ? "#43e97b" : pct >= 40 ? "#fee140" : "#ff6b6b" }}>{pct}%</td>
                      <td>
                        <div className="report-mini-bar">
                          <div className="report-mini-bar-fill" style={{
                            width: `${pct}%`,
                            background: pct >= 70 ? "#43e97b" : pct >= 40 ? "#fee140" : "#ff6b6b",
                          }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;
