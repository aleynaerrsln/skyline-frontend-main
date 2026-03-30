import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getMyTasks } from "../services/api";

const STATUS_LABELS = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

const STATUS_COLORS = {
  backlog: { bg: "rgba(139,143,163,0.15)", color: "#8b8fa3" },
  todo: { bg: "rgba(79,172,254,0.15)", color: "#4facfe" },
  in_progress: { bg: "rgba(254,225,64,0.15)", color: "#fee140" },
  in_review: { bg: "rgba(168,130,255,0.15)", color: "#a882ff" },
  done: { bg: "rgba(67,233,123,0.15)", color: "#43e97b" },
};

const PRIORITY_COLORS = {
  low: { bg: "rgba(67,233,123,0.12)", color: "#43e97b" },
  medium: { bg: "rgba(254,225,64,0.12)", color: "#fee140" },
  high: { bg: "rgba(255,107,107,0.12)", color: "#ff6b6b" },
};

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "in_progress", label: "In Progress" },
  { key: "todo", label: "To Do" },
  { key: "in_review", label: "In Review" },
  { key: "backlog", label: "Backlog" },
  { key: "done", label: "Done" },
];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getRemainingText(endDate) {
  if (!endDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diffMs = end - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `${Math.abs(diffDays)} day overdue`, color: "#ff6b6b", urgent: true };
  if (diffDays === 0) return { text: "Due today", color: "#ff6b6b", urgent: true };
  if (diffDays === 1) return { text: "Due tomorrow", color: "#ffa502", urgent: true };
  if (diffDays <= 3) return { text: `${diffDays} days left`, color: "#ffa502", urgent: false };
  if (diffDays <= 7) return { text: `${diffDays} days left`, color: "#fee140", urgent: false };
  return { text: `${diffDays} days left`, color: "#43e97b", urgent: false };
}

function MyTasks() {
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await getMyTasks();
        setTasks(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  // Sort by remaining time: done tasks go to bottom, then sort by endDate ascending (closest deadline first)
  const sorted = [...filtered].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    const aEnd = a.endDate ? new Date(a.endDate).getTime() : Infinity;
    const bEnd = b.endDate ? new Date(b.endDate).getTime() : Infinity;
    return aEnd - bEnd;
  });

  const statusCounts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <p className="empty-text">Loading...</p>;

  return (
    <div className="my-tasks-page">
      <h2 className="page-title">My Tasks</h2>

      {/* Stats */}
      <div className="my-tasks-stats">
        <div className="my-tasks-stat">
          <span className="my-tasks-stat-number">{tasks.length}</span>
          <span className="my-tasks-stat-label">Total</span>
        </div>
        <div className="my-tasks-stat">
          <span className="my-tasks-stat-number" style={{ color: "#fee140" }}>
            {(statusCounts.in_progress || 0) + (statusCounts.todo || 0)}
          </span>
          <span className="my-tasks-stat-label">Active</span>
        </div>
        <div className="my-tasks-stat">
          <span className="my-tasks-stat-number" style={{ color: "#a882ff" }}>
            {statusCounts.in_review || 0}
          </span>
          <span className="my-tasks-stat-label">In Review</span>
        </div>
        <div className="my-tasks-stat">
          <span className="my-tasks-stat-number" style={{ color: "#43e97b" }}>
            {statusCounts.done || 0}
          </span>
          <span className="my-tasks-stat-label">Completed</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tabs">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${filter === tab.key ? "active" : ""}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            {tab.key !== "all" && statusCounts[tab.key] ? ` (${statusCounts[tab.key]})` : ""}
            {tab.key === "all" ? ` (${tasks.length})` : ""}
          </button>
        ))}
      </div>

      {/* Task List */}
      {sorted.length === 0 ? (
        <div className="placeholder-card" style={{ background: "#161821", border: "1px solid #21232d", borderRadius: 14, padding: 60, textAlign: "center", color: "#555" }}>
          <p>{filter === "all" ? "No tasks assigned to you yet." : `No ${STATUS_LABELS[filter]} tasks.`}</p>
        </div>
      ) : (
        <div className="my-tasks-list">
          {sorted.map((task) => {
            const remaining = task.status !== "done" ? getRemainingText(task.endDate) : null;
            return (
              <div
                key={task._id}
                className="my-task-card"
                onClick={() => setSelectedTask(task)}
                style={remaining?.urgent ? { borderColor: "rgba(255,107,107,0.3)" } : undefined}
              >
                <div className="my-task-card-left">
                  <div
                    className="my-task-project-dot"
                    style={{ background: task.project?.color || "#667eea" }}
                  />
                  <div className="my-task-card-content">
                    <div className="my-task-card-title">{task.title}</div>
                    <div className="my-task-card-meta">
                      <span className="my-task-project-name">{task.project?.name || "Unknown project"}</span>
                      <span className="my-task-card-date">
                        {formatDate(task.startDate)} → {formatDate(task.endDate)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="my-task-card-right">
                  {remaining && (
                    <span className="badge" style={{ background: `${remaining.color}15`, color: remaining.color, minWidth: 80, textAlign: "center" }}>
                      {remaining.text}
                    </span>
                  )}
                  <span
                    className="badge"
                    style={{
                      background: PRIORITY_COLORS[task.priority]?.bg,
                      color: PRIORITY_COLORS[task.priority]?.color,
                    }}
                  >
                    {task.priority}
                  </span>
                  <span
                    className="badge"
                    style={{
                      background: STATUS_COLORS[task.status]?.bg,
                      color: STATUS_COLORS[task.status]?.color,
                    }}
                  >
                    {STATUS_LABELS[task.status]}
                  </span>
                  {task.assignees?.length > 1 && (
                    <div className="my-task-avatars">
                      {task.assignees.slice(0, 3).map((a) => (
                        <div key={a._id} className="task-card-assignee" title={`${a.name} ${a.surname || ""}`}>
                          {a.name?.charAt(0)}{a.surname?.charAt(0) || ""}
                        </div>
                      ))}
                      {task.assignees.length > 3 && (
                        <div className="task-card-assignee" style={{ background: "#333", fontSize: 9 }}>
                          +{task.assignees.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 520 }}>
            <button className="modal-close" onClick={() => setSelectedTask(null)}>✕</button>
            <h2 className="modal-title">{selectedTask.title}</h2>

            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <span
                className="badge"
                style={{
                  background: STATUS_COLORS[selectedTask.status]?.bg,
                  color: STATUS_COLORS[selectedTask.status]?.color,
                }}
              >
                {STATUS_LABELS[selectedTask.status]}
              </span>
              <span
                className="badge"
                style={{
                  background: PRIORITY_COLORS[selectedTask.priority]?.bg,
                  color: PRIORITY_COLORS[selectedTask.priority]?.color,
                }}
              >
                {selectedTask.priority}
              </span>
              {selectedTask.status !== "done" && getRemainingText(selectedTask.endDate) && (
                <span
                  className="badge"
                  style={{
                    background: `${getRemainingText(selectedTask.endDate).color}15`,
                    color: getRemainingText(selectedTask.endDate).color,
                  }}
                >
                  {getRemainingText(selectedTask.endDate).text}
                </span>
              )}
            </div>

            {selectedTask.description && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, color: "#8b8fa3", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Description</h4>
                <p style={{ color: "#c8cad0", fontSize: 14, lineHeight: 1.6 }}>{selectedTask.description}</p>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 13, color: "#8b8fa3", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Dates</h4>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#8b8fa3", marginBottom: 4 }}>Start</div>
                  <div style={{ fontSize: 14, color: "#e1e4e8", fontWeight: 500 }}>{formatDate(selectedTask.startDate)}</div>
                </div>
                <div style={{ flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#8b8fa3", marginBottom: 4 }}>Deadline</div>
                  <div style={{ fontSize: 14, color: "#e1e4e8", fontWeight: 500 }}>{formatDate(selectedTask.endDate)}</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 13, color: "#8b8fa3", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Project</h4>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  background: "rgba(255,255,255,0.03)", borderRadius: 10, cursor: "pointer",
                }}
                onClick={() => {
                  setSelectedTask(null);
                  navigate(`/app/projects/${selectedTask.project?._id}`);
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: selectedTask.project?.color || "#667eea" }} />
                <span style={{ color: "#e1e4e8", fontWeight: 500, fontSize: 14 }}>{selectedTask.project?.name}</span>
                <span style={{ marginLeft: "auto", color: "#667eea", fontSize: 12 }}>Go to board →</span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 13, color: "#8b8fa3", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Assignees</h4>
              <div className="member-list">
                {selectedTask.assignees?.map((a) => (
                  <div key={a._id} className="member-item" style={{ background: a._id === user._id ? "rgba(102,126,234,0.08)" : "rgba(255,255,255,0.03)" }}>
                    <div className="member-avatar" style={{ background: a._id === user._id ? "linear-gradient(135deg, #667eea, #764ba2)" : "#444", width: 32, height: 32, fontSize: 12 }}>
                      {a.name?.charAt(0)}{a.surname?.charAt(0) || ""}
                    </div>
                    <div className="member-info">
                      <span className="member-name" style={{ fontSize: 13 }}>
                        {a.name} {a.surname || ""}{a._id === user._id ? " (you)" : ""}
                      </span>
                      <span className="member-email" style={{ fontSize: 11 }}>
                        {Array.isArray(a.role) ? a.role.join(", ") : a.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyTasks;
