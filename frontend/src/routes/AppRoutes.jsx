import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import MembersListPage from "../pages/members/MembersListPage";
import MemberDetailsPage from "../pages/members/MemberDetailsPage";
import TrainersListPage from "../pages/trainers/TrainersListPage";
import TrainerDetailsPage from "../pages/trainers/TrainerDetailsPage";
import MembershipsPage from "../pages/memberships/MembershipsPage";
import MembershipDetailsPage from "../pages/memberships/MembershipDetailsPage";
import SessionsPage from "../pages/sessions/SessionsPage";
import UsersListPage from "../pages/users/UsersListPage";
import UserDetailsPage from "../pages/users/UserDetailsPage";
import NotFoundPage from "../pages/NotFoundPage";

import ProtectedRoute from "./ProtectedRoute";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Main Dashboard Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/members" element={<MembersListPage />} />
        <Route path="/members/:id" element={<MemberDetailsPage />} />
        <Route path="/trainers" element={<TrainersListPage />} />
        <Route path="/trainers/:id" element={<TrainerDetailsPage />} />
        <Route path="/memberships" element={<MembershipsPage />} />
        <Route path="/memberships/:id" element={<MembershipDetailsPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute requireAdmin>
              <UsersListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute requireAdmin>
              <UserDetailsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
