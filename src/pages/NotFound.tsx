import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center space-y-6 max-w-sm">
        {/* Large 404 */}
        <div className="relative">
          <p className="text-[120px] font-black leading-none text-muted/60 select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <Home className="w-9 h-9 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            The page at <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{location.pathname}</code> doesn&apos;t exist.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button onClick={() => navigate("/")} className="gap-2">
            <Home className="w-4 h-4" />
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
