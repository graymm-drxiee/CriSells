import { useState } from "react";
import { Bell, ShieldCheck, User } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "./ui";
import { useAdminAuth } from "./AdminAuthContext";

const PREFS_KEY = "crisells_admin_notification_prefs";

type Prefs = { orders: boolean; stock: boolean };

const defaultPrefs: Prefs = { orders: true, stock: true };

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...defaultPrefs, ...(JSON.parse(raw) as Partial<Prefs>) } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink">{label}</p>
        <p className="mt-0.5 text-xs text-ink/45">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
          checked ? "bg-accent" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : ""
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

export function AdminSettings() {
  const { user } = useAdminAuth();
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof Prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const save = () => {
    // shortcut: preferences are stored locally and don't filter the bell yet; wire to the notifications API when one exists.
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div className="animate-slide-down">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-[13px] text-ink/55">Manage your admin profile and notification preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="animate-slide-down">
          <CardHeader className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <User className="h-4 w-4" aria-hidden="true" />
            </span>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Name" value={user?.name || ""} readOnly />
            <Input label="Email" value={user?.email || ""} readOnly />
            <div className="flex items-center gap-2 text-xs text-ink/45">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span className="capitalize">{user?.role || "staff"} account</span>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-down" >
          <CardHeader className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Bell className="h-4 w-4" aria-hidden="true" />
            </span>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-white/5">
              <Toggle
                label="Order activity"
                description="New orders and status changes."
                checked={prefs.orders}
                onChange={() => toggle("orders")}
              />
              <Toggle
                label="Low stock alerts"
                description="Products at or below their stock threshold."
                checked={prefs.stock}
                onChange={() => toggle("stock")}
              />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button type="button" onClick={save}>
                Save Preferences
              </Button>
              {saved && <span className="text-xs font-medium text-emerald-300">Preferences saved.</span>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
