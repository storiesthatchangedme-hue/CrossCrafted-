import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#A855F7] border-r-transparent" />
          <p className="mt-4 text-[#94A3B8] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated at all → redirect to login
  if (!user || user === false) {
    return <Navigate to="/login" replace />;
  }

  // Admin users bypass onboarding checks
  if (user.role === 'admin') {
    return children;
  }

  // Rejected accounts → redirect to login with error
  if (user.status === 'rejected') {
    return <Navigate to="/login" replace state={{ error: 'Your account has been rejected.' }} />;
  }

  // Onboarding not complete → redirect to onboarding
  if (!user.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};