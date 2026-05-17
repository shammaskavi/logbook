import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Settings,
  FileText,
  Layers2,
  LayoutDashboard,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Logo from "../assets/logbook-logo.png";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Layers2, label: "Work Orders", path: "/" },
  { icon: FileText, label: "Invoices", path: "/invoices" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Settings, label: "Settings", path: "/settings/parties" },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate("/login", { replace: true });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error?.message || "Unable to sign out.",
        variant: "destructive",
      });
    }
  };

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Desktop Sidebar ── */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 transition-all duration-300 ease-in-out",
          collapsed ? "w-[64px]" : "w-[220px]"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border shrink-0",
          collapsed && "justify-center px-0"
        )}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
            <img src={Logo} alt="Logbook Logo" className="h-8 w-8 rounded-lg" />
          </div>
          {!collapsed && (
            <span className="text-sidebar-foreground font-semibold text-sm tracking-tight truncate">
              Logbook
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 p-2 pt-3 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg transition-colors text-sm font-medium",
                collapsed ? "w-10 h-10 mx-auto justify-center" : "w-full px-3 py-2.5",
                isActive(item.path)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="flex flex-col gap-1 p-2 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex items-center gap-3 rounded-lg transition-colors text-sm font-medium text-sidebar-foreground/50 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              collapsed ? "w-10 h-10 mx-auto justify-center" : "w-full px-3 py-2.5"
            )}
          >
            <ChevronRight className={cn(
              "flex-shrink-0 transition-transform duration-300",
              collapsed ? "w-5 h-5" : "w-4 h-4 rotate-180"
            )} />
            {!collapsed && <span>Collapse</span>}
          </button>

          <button
            onClick={handleLogout}
            title={collapsed ? "Sign Out" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg transition-colors text-sm font-medium text-sidebar-foreground/50 hover:bg-destructive/10 hover:text-destructive",
              collapsed ? "w-10 h-10 mx-auto justify-center" : "w-full px-3 py-2.5"
            )}
          >
            <LogOut className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border flex items-stretch h-[60px] safe-area-inset-bottom">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 transition-colors min-w-0",
                active
                  ? "text-sidebar-primary"
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className={cn(
                "text-[10px] font-medium truncate w-full text-center px-1 leading-tight",
                active ? "text-sidebar-primary" : "text-sidebar-foreground/50"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
