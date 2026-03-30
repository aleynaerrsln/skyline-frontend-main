export const ROLES = [
  { value: "proje_yoneticisi", label: "Proje Yoneticisi", color: "#ff6b6b" },
  { value: "insan_kaynaklari", label: "Insan Kaynaklari", color: "#f093fb" },
  { value: "mudur", label: "Mudur", color: "#764ba2" },
  { value: "ceo", label: "CEO", color: "#ffa502" },
  { value: "developer", label: "Developer", color: "#667eea" },
  { value: "frontend", label: "Frontend", color: "#4facfe" },
  { value: "backend", label: "Backend", color: "#43e97b" },
  { value: "tasarimci", label: "Tasarimci", color: "#f093fb" },
  { value: "ux_tasarimci", label: "UX Tasarimci", color: "#fa709a" },
  { value: "urun_analisti", label: "Urun Analisti", color: "#fee140" },
  { value: "test_uzmani", label: "Test Uzmani", color: "#30cfd0" },
  { value: "scrum_master", label: "Scrum Master", color: "#a18cd1" },
  { value: "veritabani", label: "Veritabani", color: "#ff9a9e" },
  { value: "raporlama", label: "Raporlama", color: "#fbc2eb" },
];

export const PERMISSIONS = [
  { value: "proje_ekle", label: "Proje Ekle", group: "Proje" },
  { value: "proje_duzenle", label: "Proje Duzenle", group: "Proje" },
  { value: "proje_sil", label: "Proje Sil", group: "Proje" },
  { value: "task_ekle", label: "Task Ekle", group: "Task" },
  { value: "task_duzenle", label: "Task Duzenle", group: "Task" },
  { value: "task_sil", label: "Task Sil", group: "Task" },
  { value: "task_surukle", label: "Task Surukle", group: "Task" },
  { value: "uye_ekle", label: "Uye Ekle", group: "Takim" },
  { value: "uye_duzenle", label: "Uye Duzenle", group: "Takim" },
  { value: "uye_sil", label: "Uye Sil", group: "Takim" },
  { value: "yetki_yonet", label: "Yetki Yonet", group: "Takim" },
  { value: "event_ekle", label: "Event Ekle", group: "Takvim" },
  { value: "event_sil", label: "Event Sil", group: "Takvim" },
  { value: "rapor_goruntule", label: "Rapor Goruntule", group: "Rapor" },
];

export const PERMISSION_GROUPS = ["Proje", "Task", "Takim", "Takvim", "Rapor"];

export function hasPerm(user, perm) {
  if (!user) return false;
  if (user.role === "proje_yoneticisi") return true;
  return user.permissions?.includes(perm) || false;
}

export function getRoleLabel(role) {
  return ROLES.find((r) => r.value === role)?.label || role;
}

export function getRoleColor(role) {
  return ROLES.find((r) => r.value === role)?.color || "#667eea";
}
