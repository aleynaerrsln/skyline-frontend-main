const roleColors = {
  admin: "#ff6b6b",
  yonetici: "#764ba2",
  developer: "#667eea",
  frontend: "#4facfe",
  backend: "#43e97b",
  tasarimci: "#f093fb",
  "ux-tasarimci": "#fa709a",
  "urun-analisti": "#fee140",
  "test-uzmani": "#30cfd0",
  "scrum-master": "#a18cd1",
  veritabani: "#ff9a9e",
  raporlama: "#fbc2eb",
};

const roleLabels = {
  admin: "Admin",
  yonetici: "Yonetici",
  developer: "Developer",
  frontend: "Frontend",
  backend: "Backend",
  tasarimci: "Tasarimci",
  "ux-tasarimci": "UX Tasarimci",
  "urun-analisti": "Urun Analisti",
  "test-uzmani": "Test Uzmani",
  "scrum-master": "Scrum Master",
  veritabani: "Veritabani",
  raporlama: "Raporlama",
};

function getRolesArray(role) {
  if (Array.isArray(role)) return role;
  if (typeof role === "string") return [role];
  return [];
}

function ProjectModal({ project, onClose }) {
  if (!project) return null;

  const priorityLabels = { low: "Low", medium: "Medium", high: "High" };
  const statusLabels = {
    active: "Active",
    pending: "Pending",
    completed: "Completed",
    archived: "Archived",
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-header" style={{ borderLeft: `4px solid ${project.color}` }}>
          <h2>{project.name}</h2>
          <div className="modal-badges">
            <span className={`badge badge-${project.status}`}>
              {statusLabels[project.status]}
            </span>
            <span className={`badge badge-priority-${project.priority}`}>
              {priorityLabels[project.priority]}
            </span>
          </div>
        </div>

        <div className="modal-body">
          {project.description && (
            <div className="modal-section">
              <h4>Description</h4>
              <p>{project.description}</p>
            </div>
          )}

          <div className="modal-section">
            <h4>Progress</h4>
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${project.progress}%`, background: project.color }}
                />
              </div>
              <span className="progress-text">{project.progress}%</span>
            </div>
          </div>

          <div className="modal-section">
            <h4>Dates</h4>
            <div className="modal-dates">
              <div>
                <span className="date-label">Start:</span>
                <span>{new Date(project.startDate).toLocaleDateString("tr-TR")}</span>
              </div>
              <div>
                <span className="date-label">End:</span>
                <span>{new Date(project.endDate).toLocaleDateString("tr-TR")}</span>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <h4>Team Members</h4>
            <div className="member-list">
              {project.members && project.members.length > 0 ? (
                project.members.map((member) => {
                  const memberRoles = getRolesArray(member.role);
                  return (
                    <div key={member._id} className="member-item">
                      <div className="member-avatar" style={{ background: project.color }}>
                        {member.name.charAt(0)}{member.surname?.charAt(0) || ""}
                      </div>
                      <div className="member-info">
                        <span className="member-name">{member.name} {member.surname}</span>
                        <span className="member-email">{member.email}</span>
                        <div className="member-roles-list" style={{ marginTop: 4 }}>
                          {memberRoles.map((r) => (
                            <span
                              key={r}
                              className="role-badge"
                              style={{ background: (roleColors[r] || "#667eea") + "20", color: roleColors[r] || "#667eea", fontSize: 10 }}
                            >
                              {roleLabels[r] || r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="no-members">No team members assigned</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectModal;
