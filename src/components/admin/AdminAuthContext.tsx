import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface AdminUser {
  email: string;
  name: string;
  role: "admin" | "owner" | "manager" | "staff";
}

export interface TwoFactorSetup {
  enrolled: boolean;
  issuer: string;
  account: string;
  secret?: string;
  qr?: string;
}

interface AdminAuthContextValue {
  user: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

async function post(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // The session cookie is httpOnly, so the server is the source of truth.
  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await post("/api/admin/logout").catch(() => null);
    setUser(null);
    // The storefront header holds its own user state; tell it we are signed out.
    window.dispatchEvent(new CustomEvent("crisells-auth-change", { detail: { user: null } }));
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
