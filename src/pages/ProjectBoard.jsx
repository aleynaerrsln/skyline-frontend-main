import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import {
  getProject,
  getTasks,
  createTask,
  updateTask,
  reorderTasks,
  deleteTask,
} from "../services/api";
import { hasPerm } from "../utils/permissions";

const COLUMNS = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "in_review", label: "In Review" },
  { key: "done", label: "Done" },
];

const PRIORITIES = ["low", "medium", "high"];

const priorityColors = {
  low: { bg: "rgba(67,233,123,0.12)", color: "#43e97b" },
  medium: { bg: "rgba(254,225,64,0.12)", color: "#fee140" },
  high: { bg: "rgba(255,107,107,0.12)", color: "#ff6b6b" },
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function ProjectBoard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const canAdd = hasPerm(user, "task_ekle");
  const canEdit = hasPerm(user, "task_duzenle");
  const canDelete = hasPerm(user, "task_sil");
  const canDrag = hasPerm(user, "task_surukle");

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [draggingTaskId, setDraggingTaskId] = useState(null);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "", description: "", priority: "medium", assignees: [], status: "backlog", startDate: "", endDate: "",
  });

  // Edit modal
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "", description: "", priority: "medium", assignees: [], status: "backlog", startDate: "", endDate: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  const dragRef = useRef({ taskId: null, sourceStatus: null });

  const fetchData = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        getProject(projectId),
        getTasks(projectId),
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const getColumnTasks = (status) =>
    tasks
      .filter((t) => t.status === status)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // ---- Drag and Drop ----
  const handleDragStart = (e, task) => {
    if (!canDrag) return;
    dragRef.current = { taskId: task._id, sourceStatus: task.status };
    setDraggingTaskId(task._id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task._id);
  };

  const handleDragOver = (e, columnKey) => {
    if (!canDrag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnKey);
  };

  const handleDragLeave = (e, columnKey) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverColumn === columnKey) setDragOverColumn(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (!canDrag) return;
    setDragOverColumn(null);
    setDraggingTaskId(null);

    const { taskId, sourceStatus } = dragRef.current;
    dragRef.current = { taskId: null, sourceStatus: null };
    if (!taskId || sourceStatus === targetStatus) return;

    // Optimistic update
    setTasks((prev) => prev.map((t) =>
      t._id === taskId ? { ...t, status: targetStatus } : t
    ));

    try {
      // Single API call: update status + reorder in one go
      await updateTask(taskId, { status: targetStatus });
      // Refetch to get server truth
      const tasksRes = await getTasks(projectId);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error(err);
      const tasksRes = await getTasks(projectId);
      setTasks(tasksRes.data);
    }
  };

  const handleDragEnd = () => {
    setDragOverColumn(null);
    setDraggingTaskId(null);
    dragRef.current = { taskId: null, sourceStatus: null };
  };

  // ---- Add Task ----
  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      await createTask({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        assignees: newTask.assignees,
        status: newTask.status,
        startDate: newTask.startDate,
        endDate: newTask.endDate,
        project: projectId,
      });
      setNewTask({ title: "", description: "", priority: "medium", assignees: [], status: "backlog", startDate: "", endDate: "" });
      setShowAddModal(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // ---- Edit Task ----
  const openEditModal = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      assignees: task.assignees?.map((a) => a._id) || [],
      status: task.status,
      startDate: task.startDate ? task.startDate.slice(0, 10) : "",
      endDate: task.endDate ? task.endDate.slice(0, 10) : "",
    });
  };

  const handleEditSave = async () => {
    if (!editForm.title.trim() || !editingTask) return;
    setEditLoading(true);
    try {
      await updateTask(editingTask._id, {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        assignees: editForm.assignees,
        status: editForm.status,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
      });
      setEditingTask(null);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  const toggleEditAssignee = (memberId) => {
    setEditForm((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(memberId)
        ? prev.assignees.filter((id) => id !== memberId)
        : [...prev.assignees, memberId],
    }));
  };

  // ---- Delete Task ----
  const handleDeleteTask = async (taskId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Delete this task?")) return;
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAssignee = (memberId) => {
    setNewTask((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(memberId)
        ? prev.assignees.filter((id) => id !== memberId)
        : [...prev.assignees, memberId],
    }));
  };

  if (loading) return <p className="empty-text">Loading...</p>;
  if (!project) return <p className="empty-text">Project not found</p>;

  return (
    <div className="project-board-page">
      <div className="board-header">
        <button className="back-btn" onClick={() => navigate("/app/projects")}>←</button>
        <h2 className="page-title" style={{ marginBottom: 0, flex: 1 }}>{project.name}</h2>
        {canAdd && (
          <button
            className="btn btn-create"
            onClick={() => {
              setNewTask({ title: "", description: "", priority: "medium", assignees: [], status: "backlog", startDate: "", endDate: "" });
              setShowAddModal(true);
            }}
          >
            + Add Task
          </button>
        )}
      </div>

      <div className="board-columns">
        {COLUMNS.map((col) => {
          const colTasks = getColumnTasks(col.key);
          return (
            <div
              key={col.key}
              className={`board-column${dragOverColumn === col.key ? " drag-over" : ""}`}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={(e) => handleDragLeave(e, col.key)}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              <div className="column-header">
                <span className="column-title">{col.label}</span>
                <span className="column-count">{colTasks.length}</span>
              </div>
              <div className="column-tasks">
                {colTasks.map((task) => (
                  <div
                    key={task._id}
                    className={`task-card${draggingTaskId === task._id ? " dragging" : ""}`}
                    draggable={canDrag}
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onClick={() => canEdit && openEditModal(task)}
                    style={!canEdit ? { cursor: "default" } : undefined}
                  >
                    <div className="task-card-title">{task.title}</div>
                    <div className="task-card-dates">
                      {task.startDate && <span title="Start">{new Date(task.startDate).toLocaleDateString("tr-TR")}</span>}
                      {task.endDate && <span title="Deadline" style={{ color: new Date(task.endDate) < new Date() && task.status !== "done" ? "#ff6b6b" : "#667eea" }}>→ {new Date(task.endDate).toLocaleDateString("tr-TR")}</span>}
                    </div>
                    <div className="task-card-footer">
                      <span
                        className="badge"
                        style={{
                          background: priorityColors[task.priority]?.bg,
                          color: priorityColors[task.priority]?.color,
                        }}
                      >
                        {task.priority}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {canDelete && (
                          <button className="task-delete-btn" onClick={(e) => handleDeleteTask(task._id, e)}>✕</button>
                        )}
                        {task.assignees?.length > 0 && (
                          <div className="task-assignees-row">
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
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ---- Add Task Modal ---- */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            <h2 className="modal-title">New Task</h2>

            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Task title"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleAddTask(); }}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={newTask.startDate}
                  onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  value={newTask.endDate}
                  min={newTask.startDate || undefined}
                  onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Column</label>
              <div className="priority-select">
                {COLUMNS.map((col) => (
                  <button
                    key={col.key}
                    type="button"
                    className={`priority-btn ${newTask.status === col.key ? "selected" : ""}`}
                    style={newTask.status === col.key ? { background: "rgba(102,126,234,0.15)", color: "#667eea", borderColor: "transparent" } : {}}
                    onClick={() => setNewTask({ ...newTask, status: col.key })}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <div className="priority-select">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`priority-btn priority-${p} ${newTask.priority === p ? "selected" : ""}`}
                    onClick={() => setNewTask({ ...newTask, priority: p })}
                  >
                    {p === "low" ? "Low" : p === "medium" ? "Medium" : "High"}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Assignees *</label>
              {project.members?.length > 0 ? (
                <div className="member-select-list" style={newTask.assignees.length === 0 ? { borderColor: "rgba(255,107,107,0.4)" } : {}}>
                  {project.members.map((m) => (
                    <div
                      key={m._id}
                      className={`member-select-item ${newTask.assignees.includes(m._id) ? "selected" : ""}`}
                      onClick={() => toggleAssignee(m._id)}
                    >
                      <div className="member-select-avatar">{m.name?.charAt(0)}{m.surname?.charAt(0) || ""}</div>
                      <div className="member-select-info">
                        <span>{m.name} {m.surname || ""}</span>
                        <span className="member-select-role">{Array.isArray(m.role) ? m.role.join(", ") : m.role}</span>
                      </div>
                      <div className="member-select-check">{newTask.assignees.includes(m._id) ? "✓" : ""}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#ff6b6b", fontSize: 13 }}>No members in this project. Add members first.</p>
              )}
              {newTask.assignees.length === 0 && (
                <p style={{ color: "#ff6b6b", fontSize: 12, marginTop: 6 }}>Please select at least one assignee</p>
              )}
            </div>
            <button className="btn" onClick={handleAddTask} disabled={newTask.assignees.length === 0 || !newTask.startDate || !newTask.endDate}>Create Task</button>
          </div>
        </div>
      )}

      {/* ---- Edit Task Modal ---- */}
      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditingTask(null)}>✕</button>
            <h2 className="modal-title">Edit Task</h2>

            <div style={{ display: "flex", gap: 12, marginBottom: 16, fontSize: 11, color: "#555" }}>
              <span>Created: {formatDate(editingTask.createdAt)}</span>
              {editingTask.statusChangedAt && (
                <span style={{ color: "#667eea" }}>Updated: {formatDate(editingTask.statusChangedAt)}</span>
              )}
            </div>

            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  value={editForm.endDate}
                  min={editForm.startDate || undefined}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Status</label>
              <div className="priority-select">
                {COLUMNS.map((col) => (
                  <button
                    key={col.key}
                    type="button"
                    className={`priority-btn ${editForm.status === col.key ? "selected" : ""}`}
                    style={editForm.status === col.key ? { background: "rgba(102,126,234,0.15)", color: "#667eea", borderColor: "transparent" } : {}}
                    onClick={() => setEditForm({ ...editForm, status: col.key })}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <div className="priority-select">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`priority-btn priority-${p} ${editForm.priority === p ? "selected" : ""}`}
                    onClick={() => setEditForm({ ...editForm, priority: p })}
                  >
                    {p === "low" ? "Low" : p === "medium" ? "Medium" : "High"}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Assignees *</label>
              {project.members?.length > 0 && (
                <div className="member-select-list" style={editForm.assignees.length === 0 ? { borderColor: "rgba(255,107,107,0.4)" } : {}}>
                  {project.members.map((m) => (
                    <div
                      key={m._id}
                      className={`member-select-item ${editForm.assignees.includes(m._id) ? "selected" : ""}`}
                      onClick={() => toggleEditAssignee(m._id)}
                    >
                      <div className="member-select-avatar">{m.name?.charAt(0)}{m.surname?.charAt(0) || ""}</div>
                      <div className="member-select-info">
                        <span>{m.name} {m.surname || ""}</span>
                        <span className="member-select-role">{Array.isArray(m.role) ? m.role.join(", ") : m.role}</span>
                      </div>
                      <div className="member-select-check">{editForm.assignees.includes(m._id) ? "✓" : ""}</div>
                    </div>
                  ))}
                </div>
              )}
              {editForm.assignees.length === 0 && (
                <p style={{ color: "#ff6b6b", fontSize: 12, marginTop: 6 }}>Please select at least one assignee</p>
              )}
            </div>
            <button className="btn" onClick={handleEditSave} disabled={editLoading || editForm.assignees.length === 0 || !editForm.startDate || !editForm.endDate}>
              {editLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectBoard;
