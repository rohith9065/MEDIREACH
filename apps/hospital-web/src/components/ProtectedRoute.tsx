import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink-muted">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "HOSPITAL_ADMIN") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="font-serif text-xl text-ink">This portal is for hospital staff</p>
        <p className="text-sm text-ink-muted">
          Your account ({user.email}) is a {user.role.toLowerCase().replace("_", " ")} account and can't access the
          hospital portal.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
