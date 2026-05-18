"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * AdminGuard
 *
 * This version verifies admin access with the backend API:
 *   GET /api/trackflow/admin/health
 *
 * Why:
 * - ALLOWED_ADMIN_EMAILS is a server-side env variable.
 * - Client components cannot safely/readably depend on ALLOWED_ADMIN_EMAILS.
 * - The backend already checks Firebase ID token + ALLOWED_ADMIN_EMAILS.
 */
const AdminGuard = ({ children }: AdminGuardProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Checking admin access...");
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (!currentUser) {
          setUser(null);
          setLoading(false);
          router.replace("/login");
          return;
        }

        setStatusMessage(`Signed in as ${currentUser.email || "unknown user"}. Verifying admin permission...`);

        const token = await currentUser.getIdToken(true);
        const response = await fetch("/api/trackflow/admin/health", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data?.success !== false) {
          setUser(currentUser);
          setLoading(false);
          return;
        }

        console.warn("Admin access denied:", {
          email: currentUser.email,
          status: response.status,
          data,
        });

        setUser(null);
        setLoading(false);
        router.replace("/unauthorized");
      } catch (error) {
        console.error("Admin guard check failed:", error);
        setUser(null);
        setLoading(false);
        router.replace("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
            Checking access
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {statusMessage}
          </p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return <>{children}</>;
};

export default AdminGuard;
