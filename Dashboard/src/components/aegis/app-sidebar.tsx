import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity, AlertTriangle, BarChart3, Bell, FileSearch,
  LayoutDashboard, ScrollText, Server, Settings, ShieldAlert, Workflow,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import { AegisLogo } from "./logo";
import { useAuthStore } from "@/stores/auth-store";

const NAV = [
  { group: "Operations", items: [
    { title: "Overview", url: "/overview", icon: LayoutDashboard },
    { title: "Threat Feed", url: "/threats", icon: ShieldAlert },
    { title: "Alerts", url: "/alerts", icon: Bell },
    { title: "Sessions", url: "/sessions", icon: Activity },
  ]},
  { group: "Forensics", items: [
    { title: "Prompt Inspector", url: "/inspector", icon: FileSearch },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
    { title: "Audit Logs", url: "/audit", icon: ScrollText },
  ]},
  { group: "Configuration", items: [
    { title: "Policies", url: "/policies", icon: Workflow },
    { title: "Providers", url: "/providers", icon: Server },
    { title: "Settings", url: "/settings", icon: Settings },
  ]},
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const session = useAuthStore((s) => s.session);
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <AegisLogo size={24} />
      </SidebarHeader>
      <SidebarContent>
        {NAV.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5 text-[oklch(0.85_0.17_75)]" />
          <span>{session?.user.email ?? "Guest session"}</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}