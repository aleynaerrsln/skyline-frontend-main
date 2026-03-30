import { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { getMe, uploadAvatar, updateProfile, getUnreadCount, switchWorkspace } from "../services/api";
import { getRoleLabel } from "../utils/permissions";

function Layout() {
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showWsSwitcher, setShowWsSwitcher] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", surname: "", email: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    getMe().then((res) => setUser(res.data)).catch(() => { localStorage.removeItem("token"); navigate("/login"); });
  }, [navigate]);

  
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => { try { const res = await getUnreadCount(); setUnreadCount(res.data.unread); } catch (e) {} };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowAvatarDropdown(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try { const formData = new FormData(); formData.append("avatar", file); const { data } = await uploadAvatar(formData); setUser((prev) => ({ ...prev, avatar: data.avatar || data.url })); setShowAvatarDropdown(false); }
    catch (err) { alert("Failed to upload avatar"); }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openProfileEdit = () => {
    setProfileForm({ name: user.name, surname: user.surname || "", email: user.email });
    setProfileError(""); setShowProfileEdit(true); setShowAvatarDropdown(false);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault(); setProfileError(""); setProfileLoading(true);
    try { const { data } = await updateProfile(profileForm); setUser((prev) => ({ ...prev, ...data })); setShowProfileEdit(false); }
    catch (err) { setProfileError(err.response?.data?.message || "Failed"); }
    finally { setProfileLoading(false); }
  };

  const handleSwitchWorkspace = async (wsId) => {
    try {
      const { data } = await switchWorkspace(wsId);
      setUser(data);
      setShowWsSwitcher(false);
      window.location.reload();
    } catch (err) { alert("Failed to switch workspace"); }
  };

  if (!user) return null;

  const hasMultipleWorkspaces = user.workspaces?.length > 1;

  return (
    <div className="layout">
      <Sidebar workspaceName={user.workspaceName} unreadCount={unreadCount} hasMultipleWorkspaces={hasMultipleWorkspaces} onSwitchClick={() => setShowWsSwitcher(true)} />
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <h2 className="page-greeting">Welcome back, {user.name}</h2>
          </div>
          <div className="topbar-right" ref={dropdownRef}>
            <div className="user-avatar" onClick={() => setShowAvatarDropdown(!showAvatarDropdown)} style={{ cursor: "pointer", overflow: "hidden" }}>
              {user.avatar ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : user.name.charAt(0).toUpperCase()}
            </div>
            {showAvatarDropdown && (
              <div className="avatar-dropdown">
                <div className="avatar-dropdown-header">
                  <span className="avatar-dropdown-name">{user.name} {user.surname || ""}</span>
                  <span className="avatar-dropdown-email">{user.email}</span>
                  <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(102,126,234,0.15)", color: "#667eea" }}>{getRoleLabel(user.role)}</span>
                  </div>
                </div>
                <div className="avatar-dropdown-divider" />
                <button className="avatar-dropdown-item" onClick={openProfileEdit}>Edit Profile</button>
                <button className="avatar-dropdown-item" onClick={() => fileInputRef.current?.click()}>Change Avatar</button>
                {hasMultipleWorkspaces && (
                  <button className="avatar-dropdown-item" onClick={() => { setShowWsSwitcher(true); setShowAvatarDropdown(false); }}>Switch Workspace</button>
                )}
                <div className="avatar-dropdown-divider" />
                <button className="avatar-dropdown-item" onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}>Logout</button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          </div>
        </header>
        <div className="content-area">
          <Outlet context={{ user, setUser }} />
        </div>
      </main>

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <div className="modal-overlay" onClick={() => setShowProfileEdit(false)}>
          <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowProfileEdit(false)}>✕</button>
            <h2 className="modal-title">Edit Profile</h2>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div className="avatar-upload" onClick={() => fileInputRef.current?.click()}>
                {user.avatar ? <img src={user.avatar} alt="" className="avatar-upload-img" /> : <div className="avatar-upload-fallback">{user.name?.charAt(0)?.toUpperCase()}</div>}
                <div className="avatar-upload-overlay">Change</div>
              </div>
            </div>
            {profileError && <div className="error-msg">{profileError}</div>}
            <form onSubmit={handleProfileSave}>
              <div className="form-row">
                <div className="form-group"><label>Name</label><input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required /></div>
                <div className="form-group"><label>Surname</label><input type="text" value={profileForm.surname} onChange={(e) => setProfileForm({ ...profileForm, surname: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Email</label><input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required /></div>
              <div className="form-group">
                <label>Role</label>
                <span className="role-badge" style={{ background: "rgba(102,126,234,0.15)", color: "#667eea" }}>{getRoleLabel(user.role)}</span>
              </div>
              <button className="btn" type="submit" disabled={profileLoading}>{profileLoading ? "Saving..." : "Save Changes"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Workspace Switcher Modal */}
      {showWsSwitcher && (
        <div className="modal-overlay" onClick={() => setShowWsSwitcher(false)}>
          <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()} style={{ width: 400 }}>
            <button className="modal-close" onClick={() => setShowWsSwitcher(false)}>✕</button>
            <h2 className="modal-title">Switch Workspace</h2>
            <div className="member-select-list" style={{ maxHeight: 400 }}>
              {user.workspaces?.map((ws) => {
                const isActive = ws._id?.toString() === user.activeWorkspace?.toString();
                return (
                  <div
                    key={ws._id}
                    className={`member-select-item ${isActive ? "selected" : ""}`}
                    onClick={() => !isActive && handleSwitchWorkspace(ws._id)}
                    style={{ cursor: isActive ? "default" : "pointer" }}
                  >
                    <div className="member-select-avatar" style={{ background: isActive ? "#667eea" : "#333" }}>
                      {ws.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="member-select-info">
                      <span>{ws.name}</span>
                      <span className="member-select-role">{getRoleLabel(ws.role)}</span>
                    </div>
                    {isActive && <div className="member-select-check">✓</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Layout;
