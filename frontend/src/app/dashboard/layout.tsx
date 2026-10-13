import AppShell from "@/components/AppShell";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return <AppShell role="recruiter">{children}</AppShell>;
}
