import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ForgotPassword from "./pages/ForgotPassword";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import MyTasks from "./pages/MyTasks";
import Calendar from "./pages/Calendar";
import Meet from "./pages/Meet";
import Teams from "./pages/Teams";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import ProjectBoard from "./pages/ProjectBoard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/app" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:projectId" element={<ProjectBoard />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="meet" element={<Meet />} />
        <Route path="teams" element={<Teams />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
