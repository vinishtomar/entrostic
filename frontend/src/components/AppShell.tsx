"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { Briefcase, Building2, LayoutDashboard, LogOut, Menu, Users, X } from "lucide-react";
import { Avatar, Logo, cn } from "@/components/ui";
import { api, ApiError, type User } from "@/lib/api";

const SessionCtx = createContext<User | null>(null);
/** The signed-in user. Only usable inside <AppShell>, which guarantees it's loaded. */
export const useSession = () => useContext(SessionCtx)!;

const NAV = {
  recruiter: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/jobs", label: "Jobs", icon: Briefcase },
    { href: "/dashboard/candidates", label: "Candidates", icon: Users },
  ],
  admin: [{ href: "/admin", label: "Companies", icon: Building2, exact: true }],
};

export default function AppShell({ role, children }: { role: "recruiter" | "admin"; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((u) => {
        if (u.role !== role) router.replace(u.role === "admin" ? "/admin" : "/dashboard");
        else setUser(u);
      })
      .catch((e) => {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) router.replace("/login");
      });
  }, [role, router]);

  async function logout() {
    await api.logout().catch(() => {});
    router.replace("/login");
  }

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}>
          <Logo />
        </motion.div>
      </div>
    );
  }

  const items = NAV[role];
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link href={items[0].href}><Logo /></Link>
      </div>
      {user.company && (
        <div className="mx-3 mb-4 flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200/70">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-900 text-xs font-semibold text-white">{user.company.name[0]}</span>
          <span className="truncate text-sm font-medium text-slate-800">{user.company.name}</span>
        </div>
      )}
      {role === "admin" && <p className="mx-5 mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">Platform admin</p>}
      <nav className="flex-1 space-y-0.5 px-3">
        {items.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              {active && (
                <motion.span layoutId="nav-active" className="absolute inset-0 rounded-lg bg-indigo-50" transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
              )}
              <item.icon className="relative h-4.5 w-4.5" />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={user.full_name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{user.full_name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <button onClick={logout} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" title="Sign out" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <SessionCtx.Provider value={user}>
      <div className="min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200/70 bg-white lg:block">{sidebar}</aside>

        {/* Mobile top bar + drawer */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="-ml-1 rounded-md p-1.5 text-slate-600 hover:bg-slate-100" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <Logo />
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
              <motion.aside
                className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl lg:hidden"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              >
                <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 rounded-md p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close menu">
                  <X className="h-4 w-4" />
                </button>
                {sidebar}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="lg:pl-64">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </SessionCtx.Provider>
  );
}

export function PageHeader({ title, description, actions }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <div className="mt-1 text-sm text-slate-500">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
