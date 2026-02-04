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
import OTPVerificationPage from "./pages/auth/OTPVerificationPage";
import NotFound from "./pages/NotFound";

// Faculty Pages
import FacultyHome from "./pages/faculty/FacultyHome";
import TimetablePage from "./pages/faculty/TimetablePage";
import LeaveHome from "./pages/faculty/LeaveHome";
import ApplyLeavePage from "./pages/faculty/ApplyLeavePage";
import LeaveHistoryPage from "./pages/faculty/LeaveHistoryPage";
import AnnouncementsPage from "./pages/faculty/AnnouncementsPage";
import EventsPage from "./pages/faculty/EventsPage";
import NotificationsPage from "./pages/faculty/NotificationsPage";
import ExamsPage from "./pages/faculty/ExamsPage";
import ProfilePage from "./pages/faculty/ProfilePage";

// Admin Pages
import AdminHome from "./pages/admin/AdminHome";

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
              <Route path="leave/apply" element={<ApplyLeavePage />} />
              <Route path="leave-history" element={<LeaveHistoryPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="exams" element={<ExamsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout role="admin" />
              </ProtectedRoute>
            }>
              <Route index element={<AdminHome />} />
              <Route path="timetable" element={<TimetablePage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="exams" element={<ExamsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
