import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";

import NotFound from "./pages/NotFound";

// Faculty Pages
import FacultyHome from "./pages/faculty/FacultyHome";
import TimetablePage from "./pages/faculty/TimetablePage";
import LeaveHome from "./pages/faculty/LeaveHome";
import { ApplyLeavePage } from "./pages/faculty/ApplyLeavePage";
import LeaveHistoryPage from "./pages/faculty/LeaveHistoryPage";
import AnnouncementsPage from "./pages/faculty/AnnouncementsPage";
import EventsPage from "./pages/faculty/EventsPage";
import { NotificationsPage } from "./pages/faculty/NotificationsPage";
import ExamsPage from "./pages/faculty/ExamsPage";
import ProfilePage from "./pages/shared/ProfilePage";

// HOD Pages
import AdminHome from "./pages/admin/AdminHome";
import AllTimetablesPage from "./pages/admin/AllTimetablesPage";
import MyNotesPage from "./pages/admin/MyNotesPage";
import { FacultyInfoPage } from "./pages/admin/FacultyInfoPage";
import { LeaveRequestsPage } from "./pages/admin/LeaveRequestsPage";
import { AdminNotificationsPage } from "./pages/admin/NotificationsPage";
import OTPVerificationPage from "./pages/auth/OTPVerificationPage";
import CollegeSettingsPage from "./pages/admin/CollegeSettingsPage";
import ClassesManagerPage from "./pages/admin/ClassesManagerPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login/:role" element={<LoginPage />} />
            <Route path="/signup/faculty" element={<SignupPage />} />
            <Route path="/verify-otp" element={<OTPVerificationPage />} />


            {/* Faculty Routes */}
            <Route path="/faculty" element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <DashboardLayout role="faculty" />
              </ProtectedRoute>
            }>
              <Route index element={<FacultyHome />} />
              <Route path="timetable" element={<TimetablePage />} />
              <Route path="leave" element={<LeaveHome />} />
              <Route path="apply-leave" element={<ApplyLeavePage />} />
              <Route path="leave-history" element={<LeaveHistoryPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="exams" element={<ExamsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* HOD Routes */}
            <Route path="/hod" element={
              <ProtectedRoute allowedRoles={['hod']}>
                <DashboardLayout role="hod" />
              </ProtectedRoute>
            }>
              <Route index element={<AdminHome />} />
              <Route path="timetable" element={<TimetablePage />} />
              <Route path="all-timetables" element={<AllTimetablesPage />} />
              <Route path="notes" element={<MyNotesPage />} />
              <Route path="leave-requests" element={<LeaveRequestsPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="faculty" element={<FacultyInfoPage />} />
              <Route path="faculty/:uid/timetable" element={<TimetablePage />} />
              <Route path="exams" element={<ExamsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Principal Routes */}
            <Route path="/principal" element={
              <ProtectedRoute allowedRoles={['principal']}>
                <DashboardLayout role="principal" />
              </ProtectedRoute>
            }>
              <Route index element={<AdminHome />} />
              <Route path="all-timetables" element={<AllTimetablesPage />} />
              <Route path="leave-requests" element={<LeaveRequestsPage />} />
              <Route path="faculty" element={<FacultyInfoPage />} />
              <Route path="faculty/:uid/timetable" element={<TimetablePage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="exams" element={<ExamsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<CollegeSettingsPage />} />
              <Route path="classes" element={<ClassesManagerPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
