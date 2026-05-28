import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/aegis/app-sidebar";
import { TopNav } from "@/components/aegis/top-nav";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("aegisflow.auth.session");
    if (!raw) throw redirect({ to: "/login" });
  },
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const hydrate = useAuthStore((s) => s.hydrate);
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!session) {
      void navigate({ to: "/login" });
    }
  }, [navigate, session]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-transparent">
        <TopNav />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
      <Toaster position="top-right" richColors theme="dark" />
    </SidebarProvider>
  );
}