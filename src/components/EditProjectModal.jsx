import { useState, useEffect } from "react";
import { getTeamMembers } from "../services/api";

const colorOptions = [
  "#667eea", "#764ba2", "#f093fb", "#4facfe",
  "#43e97b", "#fa709a", "#fee140", "#ff6b6b",
  "#a18cd1", "#30cfd0", "#ff9a9e", "#fbc2eb",
];

function EditProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    name: project.name,
    description: project.description || "",
    startDate: project.startDate?.slice(0, 10) || "",
    endDate: project.endDate?.slice(0, 10) || "",
    color: project.color || "#667eea",
    priority: project.priority || "medium",
    status: project.status || "active",
    progress: project.progress || 0,
    members: project.members?.map((m) => m._id) || [],
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getTeamMembers().then((res) => setTeamMembers(res.data));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleMember = (id) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.includes(id)
        ? prev.members.filter((m) => m !== id)
        : [...prev.members, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSave(project._id, form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="modal-title">Edit Project</h2>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project Name *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="form-select">
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="form-group">
              <label>Progress ({form.progress}%)</label>
              <input type="range" name="progress" min="0" max="100" value={form.progress} onChange={handleChange} className="form-range" />
            </div>
          </div>

          <div className="form-group">
            <label>Priority</label>
            <div className="priority-select">
              {["low", "medium", "high"].map((p) => (
                <button key={p} type="button" className={`priority-btn priority-${p} ${form.priority === p ? "selected" : ""}`} onClick={() => setForm({ ...form, priority: p })}>
                  {p === "low" ? "Low" : p === "medium" ? "Medium" : "High"}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-picker">
              {colorOptions.map((c) => (
                <button key={c} type="button" className={`color-dot ${form.color === c ? "selected" : ""}`} style={{ background: c }} onClick={() => setForm({ ...form, color: c })} />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Team Members</label>
            <div className="member-select-list">
              {teamMembers.map((m) => (
                <div
                  key={m._id}
                  className={`member-select-item ${form.members.includes(m._id) ? "selected" : ""}`}
                  onClick={() => toggleMember(m._id)}
                >
                  <div className="member-select-avatar">{m.name.charAt(0)}{m.surname?.charAt(0) || ""}</div>
                  <div className="member-select-info">
                    <span>{m.name} {m.surname}</span>
                    <span className="member-select-role">{Array.isArray(m.role) ? m.role.join(", ") : m.role}</span>
                  </div>
                  <div className="member-select-check">
                    {form.members.includes(m._id) ? "✓" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProjectModal;
