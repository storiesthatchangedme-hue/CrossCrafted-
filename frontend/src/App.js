import "@/App.css";
import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LanguageProvider } from "@/components/LanguageSwitcher";

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
// SocialFeed removed - BFF/Matrimony feature deprecated
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
const AdminBusinesses = React.lazy(() => import("@/pages/admin/AdminBusinesses"));
const AdminMarketplace = React.lazy(() => import("@/pages/admin/AdminMarketplace"));
const Apologetics = React.lazy(() => import("@/pages/Apologetics"));
const ListYourChurch = React.lazy(() => import("@/pages/ListYourChurch"));
const ListYourBusiness = React.lazy(() => import("@/pages/ListYourBusiness"));
const BiblePlans = React.lazy(() => import("@/pages/BiblePlans"));
const SmallGroups = React.lazy(() => import("@/pages/SmallGroups"));
const Wishlist = React.lazy(() => import("@/pages/Wishlist"));
const AdminAnalytics = React.lazy(() => import("@/pages/admin/AdminAnalytics"));
const AdminAnnouncements = React.lazy(() => import("@/pages/admin/AdminAnnouncements"));
const AdminFeatureFlags = React.lazy(() => import("@/pages/admin/AdminFeatureFlags"));

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
      {/* Auth pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/pending-approval" element={<PendingApproval />} />
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
        <Route path="businesses" element={<AdminBusinesses />} />
        <Route path="marketplace" element={<AdminMarketplace />} />
        <Route path="comments" element={<AdminComments />} />
        <Route path="trivia" element={<AdminTrivia />} />
        <Route path="logs" element={<AdminLogs />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="feature-flags" element={<AdminFeatureFlags />} />
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
        <Route index element={<Navigate to="/app/churches" replace />} />
        <Route path="feed" element={<Navigate to="/app/churches" replace />} />
        <Route path="explore" element={<Explore />} />
        <Route path="trivia" element={<Trivia />} />
        <Route path="apologetics" element={<Apologetics />} />
        <Route path="list-church" element={<ListYourChurch />} />
        <Route path="marketplace" element={<ListYourBusiness />} />
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
        <Route path="bible-plans" element={<BiblePlans />} />
        <Route path="small-groups" element={<SmallGroups />} />
        <Route path="wishlist" element={<Wishlist />} />
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
          <LanguageProvider>
          <AppRouter />
          </LanguageProvider>
        </BrowserRouter>
        <Toaster position="top-center" />
        </ErrorBoundary>
      </div>
    </AuthProvider>
  );
}

export default App;
