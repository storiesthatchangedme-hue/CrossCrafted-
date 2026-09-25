import "@/App.css";
import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";

import '@/lib/api'; // initialize centralized API client (registers interceptors)

const Home = React.lazy(() => import("@/pages/Home"));
const About = React.lazy(() => import("@/pages/About"));
const ForChurches = React.lazy(() => import("@/pages/ForChurches"));
const ForCreators = React.lazy(() => import("@/pages/ForCreators"));
const Contact = React.lazy(() => import("@/pages/Contact"));
const Login = React.lazy(() => import("@/pages/Login"));
const Register = React.lazy(() => import("@/pages/Register"));
const AuthCallback = React.lazy(() => import("@/pages/AuthCallback"));
const Onboarding = React.lazy(() => import("@/pages/Onboarding"));
const PendingApproval = React.lazy(() => import("@/pages/PendingApproval"));
const ForgotPassword = React.lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = React.lazy(() => import("@/pages/ResetPassword"));
const AppLayout = React.lazy(() => import("@/components/AppLayout"));
const SocialFeed = React.lazy(() => import("@/pages/SocialFeed"));
const Trivia = React.lazy(() => import("@/pages/Trivia"));
const PrayerWall = React.lazy(() => import("@/pages/PrayerWall"));
const Explore = React.lazy(() => import("@/pages/Explore"));
const Churches = React.lazy(() => import("@/pages/Churches"));
const Events = React.lazy(() => import("@/pages/Events"));
const EventDetail = React.lazy(() => import("@/pages/EventDetail"));
const Shop = React.lazy(() => import("@/pages/Shop"));
const ProductDetail = React.lazy(() => import("@/pages/ProductDetail"));
const UserProfile = React.lazy(() => import("@/pages/UserProfile"));
const ChurchProfile = React.lazy(() => import("@/pages/ChurchProfile"));
const Notifications = React.lazy(() => import("@/pages/Notifications"));
const Messages = React.lazy(() => import("@/pages/Messages"));
const Conversation = React.lazy(() => import("@/pages/Conversation"));
const AdminLayout = React.lazy(() => import("@/components/AdminLayout"));
const AdminDashboard = React.lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminUsers = React.lazy(() => import("@/pages/admin/AdminUsers"));
const AdminPosts = React.lazy(() => import("@/pages/admin/AdminPosts"));
const AdminChurches = React.lazy(() => import("@/pages/admin/AdminChurches"));
const AdminEvents = React.lazy(() => import("@/pages/admin/AdminEvents"));
const AdminProducts = React.lazy(() => import("@/pages/admin/AdminProducts"));
const AdminLogs = React.lazy(() => import("@/pages/admin/AdminLogs"));
const AdminApprovals = React.lazy(() => import("@/pages/admin/AdminApprovals"));
const AdminComments = React.lazy(() => import("@/pages/admin/AdminComments"));
const AdminTrivia = React.lazy(() => import("@/pages/admin/AdminTrivia"));
const AdminReports = React.lazy(() => import("@/pages/admin/AdminReports"));

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
function AppRouter() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-[#38BDF8]">Loading...</div>}>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/for-churches" element={<ForChurches />} />
      <Route path="/for-creators" element={<ForCreators />} />
      <Route path="/contact" element={<Contact />} />
      {/* Auth pages disabled — signup/login closed for now */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/" replace />} />
      <Route path="/reset-password" element={<Navigate to="/" replace />} />
      <Route path="/auth/callback" element={<Navigate to="/" replace />} />
      <Route path="/onboarding" element={<Navigate to="/" replace />} />
      <Route path="/pending-approval" element={<Navigate to="/" replace />} />
      {/* Admin panel */}
      <Route
        path="/app/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="approvals" element={<AdminApprovals />} />
        <Route path="posts" element={<AdminPosts />} />
        <Route path="churches" element={<AdminChurches />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="comments" element={<AdminComments />} />
        <Route path="trivia" element={<AdminTrivia />} />
        <Route path="logs" element={<AdminLogs />} />
      </Route>
      {/* Main app */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/feed" replace />} />
        <Route path="feed" element={<SocialFeed />} />
        <Route path="explore" element={<Explore />} />
        <Route path="trivia" element={<Trivia />} />
        <Route path="prayer-wall" element={<PrayerWall />} />
        <Route path="churches" element={<Churches />} />
        <Route path="churches/:churchId" element={<ChurchProfile />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:eventId" element={<EventDetail />} />
        <Route path="shop" element={<Shop />} />
        <Route path="shop/:productId" element={<ProductDetail />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="profile/:userId" element={<UserProfile />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:convoId" element={<Conversation />} />
      </Route>
    </Routes>
      </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <ErrorBoundary>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
        <Toaster position="top-center" />
        </ErrorBoundary>
      </div>
    </AuthProvider>
  );
}

export default App;
