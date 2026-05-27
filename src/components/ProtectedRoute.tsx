import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Wraps routes that require a logged-in user. While the auth context is
 * still loading the initial session we render nothing (avoids a flash of
 * the sign-in screen for users who already have a valid session).
 */
export default function ProtectedRoute() {
  const { loading, user, configured } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center text-sm text-ink-muted">
        Loading...
      </div>
    );
  }

  // If Supabase isn't configured at all, send people to /signin so they see
  // the helpful "you need to set env vars" screen instead of a blank app.
  if (!configured || !user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
