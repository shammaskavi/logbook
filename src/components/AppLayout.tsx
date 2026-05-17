import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  Settings,
  FileText,
  Layers2,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import Logo from "../assets/logbook-logo.png";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";



export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();

  const navItems = [
    { icon: Layers2, label: "Work Orders", path: "/" },
    { icon: FileText, label: "Invoices", path: "/invoices" },
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Settings, label: "Settings", path: "/settings/parties" },
  ];

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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-16 flex flex-col items-center bg-sidebar py-4 gap-2 shrink-0">
        {/* Logo */}
        {/* bg-sidebar-primary */}
        <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4">
          {/* <ClipboardList className="w-5 h-5 text-sidebar-primary-foreground" /> */}
          <img src={Logo} alt="VelocityOS Logo" className="h-8 w-8  rounded-lg" />
        </div>

        {navItems.map((item) => {
          const active =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
            </button>
          );
        })}

        <div className="flex-1" />

        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>


      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
