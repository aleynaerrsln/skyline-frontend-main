import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { getProjects, createProject, updateProject, deleteProject } from "../services/api";
import { hasPerm } from "../utils/permissions";
import CreateProjectModal from "../components/CreateProjectModal";
import EditProjectModal from "../components/EditProjectModal";

const tabs = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "archived", label: "Archived" },
];

function Projects() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const canCreate = hasPerm(user, "proje_ekle");
  const canEdit = hasPerm(user, "proje_duzenle");
  const canDelete = hasPerm(user, "proje_sil");
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async (status) => {
    setLoading(true);
    try {
      const { data } = await getProjects(status === "all" ? "" : status);
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(activeTab);
  }, [activeTab]);

  const handleCreate = async (formData) => {
    await createProject(formData);
    fetchProjects(activeTab);
  };

  const handleUpdate = async (id, formData) => {
    await updateProject(id, formData);
    fetchProjects(activeTab);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    await deleteProject(id);
    fetchProjects(activeTab);
  };

  const priorityLabels = { low: "Low", medium: "Medium", high: "High" };

  return (
    <div className="projects-page">
      <div className="page-header">
        <h2 className="page-title">Projects</h2>
        {canCreate && (
          <button className="btn btn-create" onClick={() => setShowCreate(true)}>
            + New Project
          </button>
        )}
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="empty-text">Loading...</p>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <p>No projects found</p>
          {canCreate && (
            <button className="btn btn-create" onClick={() => setShowCreate(true)}>
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div
              key={project._id}
              className="project-card"
              onClick={() => navigate(`/app/projects/${project._id}`)}
            >
              <div className="project-card-top" style={{ borderTop: `3px solid ${project.color}` }}>
                <div className="project-card-header">
                  <h3>{project.name}</h3>
                  {(canEdit || canDelete) && (
                    <div className="card-actions">
                      <button
                        className="action-btn edit-btn"
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditProject(project);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete-btn"
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(project._id);
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  )}
                </div>
                {project.description && (
                  <p className="project-desc">{project.description}</p>
                )}
              </div>

              <div className="project-card-body">
                <div className="project-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${project.progress}%`, background: project.color }}
                    />
                  </div>
                  <span>{project.progress}%</span>
                </div>

                <div className="project-meta">
                  <span className={`badge badge-${project.status}`}>{project.status}</span>
                  <span className={`badge badge-priority-${project.priority}`}>
                    {priorityLabels[project.priority]}
                  </span>
                </div>

                <div className="project-dates">
                  <span>{new Date(project.startDate).toLocaleDateString("tr-TR")}</span>
                  <span>→</span>
                  <span>{new Date(project.endDate).toLocaleDateString("tr-TR")}</span>
                </div>

                <div className="project-members-row">
                  {project.members?.slice(0, 4).map((m) => (
                    <div key={m._id} className="mini-avatar" style={{ background: project.color }}>
                      {m.name.charAt(0)}{m.surname?.charAt(0) || ""}
                    </div>
                  ))}
                  {project.members?.length > 4 && (
                    <div className="mini-avatar more">+{project.members.length - 4}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {editProject && (
        <EditProjectModal
          project={editProject}
          onClose={() => setEditProject(null)}
          onSave={handleUpdate}
        />
      )}

    </div>
  );
}

export default Projects;
