import { useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { uploadAvatar } from "../services/api";

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

function Settings() {
  const { user, setUser } = useOutletContext();
  const fileInputRef = useRef(null);

  const userRoles = Array.isArray(user.role) ? user.role : (user.role ? [user.role] : []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const { data } = await uploadAvatar(formData);
      setUser((prev) => ({ ...prev, avatar: data.avatar || data.url }));
    } catch (err) {
      console.error("Avatar upload failed:", err);
      alert("Failed to upload avatar");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="settings-page">
      <h2 className="page-title">Settings</h2>

      <div className="settings-profile-card">
        <div className="avatar-upload" onClick={() => fileInputRef.current?.click()}>
          {user.avatar ? (
            <img src={user.avatar} alt="avatar" className="avatar-upload-img" />
          ) : (
            <div className="avatar-upload-fallback">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <div className="avatar-upload-overlay">Change</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
        </div>

        <div className="settings-profile-info">
          <h3 className="settings-profile-name">{user.name} {user.surname || ""}</h3>
          <p className="settings-profile-email">{user.email}</p>
          <div className="settings-profile-roles">
            {userRoles.map((r) => (
              <span
                key={r}
                className="role-badge"
                style={{ background: (roleColors[r] || "#667eea") + "20", color: roleColors[r] || "#667eea" }}
              >
                {roleLabels[r] || r}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
