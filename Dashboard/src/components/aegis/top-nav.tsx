import { Link } from "@tanstack/react-router";
import { Bell, LogOut, Search, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useWebsocketStore } from "@/stores/websocket-store";
import { useAuthStore } from "@/stores/auth-store";

export function TopNav() {
  const status = useWebsocketStore((s) => s.status);
  const alerts = useWebsocketStore((s) => s.alerts);
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);

  const statusLabel = status === "live" ? "LIVE" : status === "connecting" ? "CONNECTING" : "DISCONNECTED";
  const statusColor =
    status === "live" ? "bg-[oklch(0.72_0.17_165)] text-[oklch(0.72_0.17_165)]" : status === "connecting" ? "bg-[oklch(0.78_0.17_75)] text-[oklch(0.78_0.17_75)]" : "bg-destructive text-destructive";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl">
      <SidebarTrigger className="-ml-1" />
      <div className="relative hidden flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search threats, sessions, requests…"
          className="h-9 border-border/60 bg-card/50 pl-9 text-sm"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-md border border-border bg-card/40 px-2.5 py-1 text-xs sm:flex">
          <span className={`pulse-dot inline-block h-1.5 w-1.5 rounded-full ${statusColor}`} />
          <span className="font-medium tracking-wide">{statusLabel}</span>
          <span className="text-muted-foreground">alerts ws</span>
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {alerts.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/20 text-primary text-xs">AF</AvatarFallback>
              </Avatar>
              <div className="hidden text-left text-xs leading-tight sm:block">
                <div className="font-medium">{session?.user.name ?? "Guest"}</div>
                <div className="text-muted-foreground">{session?.role?.toUpperCase() ?? "UNAUTH"}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings"><User className="mr-2 h-4 w-4" />Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                to="/login"
                onClick={() => {
                  void logout();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}