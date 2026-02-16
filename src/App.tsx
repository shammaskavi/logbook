import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import WorkOrderForm from "./pages/WorkOrderForm";
import DCForm from "./pages/DCForm";
import NotFound from "./pages/NotFound";
import PartiesPage from "./pages/settings/PartiesPage";
import JobWorksPage from "./pages/settings/JobWorksPage";
import SettingsLayout from "./pages/settings/SettingsLayout";
import AppLayout from "@/components/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/work-order/new" element={<WorkOrderForm />} />
            <Route path="/work-order/:id/edit" element={<WorkOrderForm />} />
            <Route path="/dc/new" element={<DCForm />} />
            <Route path="/dc/:id/edit" element={<DCForm />} />
            <Route path="/settings" element={<SettingsLayout />}>
              <Route path="parties" element={<PartiesPage />} />
              <Route path="job-works" element={<JobWorksPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
