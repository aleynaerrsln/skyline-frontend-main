import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember } from "../services/api";
import { ROLES, PERMISSIONS, PERMISSION_GROUPS, hasPerm, getRoleLabel, getRoleColor } from "../utils/permissions";

function Teams() {
  const { user } = useOutletContext();
  const canAdd = hasPerm(user, "uye_ekle");
  const canEdit = hasPerm(user, "uye_duzenle");
  const canDelete = hasPerm(user, "uye_sil");
  const canManagePerms = hasPerm(user, "yetki_yonet");

  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", surname: "", email: "", password: "", role: "developer", permissions: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", surname: "", email: "", role: "", permissions: [] });
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [permMember, setPermMember] = useState(null);

  const fetchMembers = async () => {
    try { const { data } = await getTeamMembers(); setMembers(data); }
    catch (err) { console.error(err); }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await createTeamMember(form);
      setForm({ name: "", surname: "", email: "", password: "", role: "developer", permissions: [] });
      setShowForm(false); fetchMembers();
    } catch (err) { setError(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this member?")) return;
    try { await deleteTeamMember(id); fetchMembers(); }
    catch (err) { alert(err.response?.data?.message || "Failed"); }
  };

  const startEdit = (member) => {
    setEditingMember(member._id);
    setEditForm({ name: member.name, surname: member.surname || "", email: member.email, role: member.role || "developer", permissions: member.permissions || [] });
    setEditError("");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError(""); setEditLoading(true);
    try { await updateTeamMember(editingMember, editForm); setEditingMember(null); fetchMembers(); }
    catch (err) { setEditError(err.response?.data?.message || "Failed"); }
    finally { setEditLoading(false); }
  };

  const openPermModal = (member) => {
    setPermMember({ ...member, permissions: member.permissions || [] });
  };

  const togglePermission = (perm) => {
    setPermMember((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const savePermissions = async () => {
    try {
      await updateTeamMember(permMember._id, { permissions: permMember.permissions });
      setPermMember(null); fetchMembers();
    } catch (err) { alert(err.response?.data?.message || "Failed"); }
  };

  const selectAllPerms = () => setPermMember((prev) => ({ ...prev, permissions: PERMISSIONS.map((p) => p.value) }));
  const clearAllPerms = () => setPermMember((prev) => ({ ...prev, permissions: [] }));

  return (
    <div className="teams-page">
      <div className="page-header">
        <h2 className="page-title">Teams</h2>
        {canAdd && (
          <button className="btn btn-create" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ New Member"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="team-form-card">
          <h3>Create Team Member</h3>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group"><label>Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-group"><label>Surname</label><input type="text" value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div className="form-group"><label>Password *</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} required /></div>
            </div>
            <div className="form-group">
              <label>Role *</label>
              <div className="role-grid">
                {ROLES.map((r) => (
                  <button key={r.value} type="button"
                    className={`role-btn ${form.role === r.value ? "selected" : ""}`}
                    style={form.role === r.value ? { background: r.color + "25", color: r.color, borderColor: r.color } : {}}
                    onClick={() => setForm({ ...form, role: r.value })}
                  >{r.label}</button>
                ))}
              </div>
            </div>
            <button className="btn" type="submit" disabled={loading} style={{ maxWidth: 220 }}>
              {loading ? "Creating..." : "Create Member"}
            </button>
          </form>
        </div>
      )}

      <div className="members-grid">
        {members.map((member) => {
          const roleColor = getRoleColor(member.role);
          const permCount = member.role === "proje_yoneticisi" ? PERMISSIONS.length : (member.permissions?.length || 0);

          if (editingMember === member._id) {
            return (
              <div key={member._id} className="member-card edit-member-form">
                <form onSubmit={handleEditSubmit} style={{ width: "100%" }}>
                  <h4 style={{ color: "#fff", marginBottom: 12, fontSize: 15 }}>Edit Member</h4>
                  {editError && <div className="error-msg">{editError}</div>}
                  <div className="form-row">
                    <div className="form-group"><label>Name</label><input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
                    <div className="form-group"><label>Surname</label><input type="text" value={editForm.surname} onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })} /></div>
                  </div>
                  <div className="form-group"><label>Email</label><input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required /></div>
                  <div className="form-group">
                    <label>Role</label>
                    <div className="role-grid">
                      {ROLES.map((r) => (
                        <button key={r.value} type="button"
                          className={`role-btn ${editForm.role === r.value ? "selected" : ""}`}
                          style={editForm.role === r.value ? { background: r.color + "25", color: r.color, borderColor: r.color } : {}}
                          onClick={() => setEditForm({ ...editForm, role: r.value })}
                        >{r.label}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn" type="submit" disabled={editLoading} style={{ maxWidth: 160 }}>{editLoading ? "Saving..." : "Save"}</button>
                    <button className="btn" type="button" onClick={() => setEditingMember(null)} style={{ maxWidth: 120, background: "#2a2d3a" }}>Cancel</button>
                  </div>
                </form>
              </div>
            );
          }

          return (
            <div key={member._id} className="member-card">
              <div className="member-card-avatar" style={{ background: member.avatar ? "transparent" : roleColor, overflow: "hidden" }}>
                {member.avatar ? (
                  <img src={member.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  <>{member.name?.charAt(0)?.toUpperCase()}{member.surname?.charAt(0)?.toUpperCase() || ""}</>
                )}
              </div>
              <div className="member-card-info">
                <h4>{member.name} {member.surname || ""}</h4>
                <p className="member-card-email">{member.email}</p>
                <div className="member-roles-list">
                  <span className="role-badge" style={{ background: roleColor + "20", color: roleColor }}>
                    {getRoleLabel(member.role)}
                  </span>
                  <span style={{ fontSize: 10, color: "#8b8fa3", marginLeft: 4 }}>
                    {permCount}/{PERMISSIONS.length} yetki
                  </span>
                </div>
              </div>
              {(canEdit || canDelete || canManagePerms) && member._id !== user._id && (
                <div className="member-card-actions">
                  {canManagePerms && member.role !== "proje_yoneticisi" && (
                    <button className="action-btn" title="Manage Permissions" onClick={() => openPermModal(member)}>🔑</button>
                  )}
                  {canEdit && (
                    <button className="action-btn edit-btn" title="Edit" onClick={() => startEdit(member)}>✏️</button>
                  )}
                  {canDelete && (
                    <button className="delete-btn member-delete-inline" title="Delete" onClick={() => handleDelete(member._id)}>🗑</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {members.length === 0 && <div className="empty-state"><p>No team members yet</p></div>}

      {/* Permission Management Modal */}
      {permMember && (
        <div className="modal-overlay" onClick={() => setPermMember(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 560, maxHeight: "85vh", overflowY: "auto" }}>
            <button className="modal-close" onClick={() => setPermMember(null)}>✕</button>
            <h2 className="modal-title">Manage Permissions</h2>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: getRoleColor(permMember.role), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 14 }}>
                {permMember.name?.charAt(0)}{permMember.surname?.charAt(0) || ""}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "#e1e4e8" }}>{permMember.name} {permMember.surname || ""}</div>
                <div style={{ fontSize: 12, color: getRoleColor(permMember.role) }}>{getRoleLabel(permMember.role)}</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 12, color: "#8b8fa3" }}>
                {permMember.permissions.length}/{PERMISSIONS.length} selected
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button className="voice-ctrl-btn" onClick={selectAllPerms}>Select All</button>
              <button className="voice-ctrl-btn leave" onClick={clearAllPerms}>Clear All</button>
            </div>

            {PERMISSION_GROUPS.map((group) => {
              const groupPerms = PERMISSIONS.filter((p) => p.group === group);
              return (
                <div key={group} style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: 12, color: "#8b8fa3", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{group}</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {groupPerms.map((p) => {
                      const active = permMember.permissions.includes(p.value);
                      return (
                        <button
                          key={p.value}
                          type="button"
                          className={`role-btn ${active ? "selected" : ""}`}
                          style={active ? { background: "rgba(102,126,234,0.2)", color: "#667eea", borderColor: "#667eea" } : {}}
                          onClick={() => togglePermission(p.value)}
                        >
                          {active ? "✓ " : ""}{p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <button className="btn" onClick={savePermissions} style={{ marginTop: 8 }}>Save Permissions</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Teams;
