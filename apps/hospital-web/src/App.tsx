import { Routes, Route } from "react-router-dom";
import { PortalLayout } from "./layouts/PortalLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DoctorsPage } from "./pages/DoctorsPage";
import { DepartmentsPage } from "./pages/DepartmentsPage";
import { BedsPage } from "./pages/BedsPage";
import { FacilitiesPage } from "./pages/FacilitiesPage";
import { EmergencyPage } from "./pages/EmergencyPage";
import { QueuePage } from "./pages/QueuePage";
import { AmbulancesPage } from "./pages/AmbulancesPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="queue" element={<QueuePage />} />
        <Route path="ambulances" element={<AmbulancesPage />} />
        <Route path="beds" element={<BedsPage />} />
        <Route path="facilities" element={<FacilitiesPage />} />
        <Route path="emergency" element={<EmergencyPage />} />
      </Route>
    </Routes>
  );
}
