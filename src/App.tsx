import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage";
import WorkOrderForm from "./pages/WorkOrderForm";
import DCForm from "./pages/DCForm";
import DeliveryChallansPage from "./pages/DeliveryChallansPage";
import ManualDCForm from "./pages/ManualDCForm";
import InvoicesPage from "./pages/InvoicesPage";
import InvoiceForm from "./pages/InvoiceForm";
import NotFound from "./pages/NotFound";
import PartiesPage from "./pages/settings/PartiesPage";
import JobWorksPage from "./pages/settings/JobWorksPage";
import SettingsLayout from "./pages/settings/SettingsLayout";
import AppLayout from "@/components/AppLayout";
import BusinessSettingsPage from "./pages/settings/BusinessSettingsPage";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import PartyLedgerPage from "./pages/PartyLedgerPage";
import PrintSandbox from "./pages/dev/PrintSandbox";
import ScanSandbox from "./pages/dev/ScanSandbox";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            {/* Print layout harness — dev builds only, never shipped. */}
            {import.meta.env.DEV && (
              <Route path="/dev/print" element={<PrintSandbox />} />
            )}
            {import.meta.env.DEV && (
              <Route path="/dev/scan" element={<ScanSandbox />} />
            )}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/parties/:id/ledger" element={<PartyLedgerPage />} />
                <Route path="/work-order/new" element={<WorkOrderForm />} />
                <Route path="/work-order/:id/edit" element={<WorkOrderForm />} />
                <Route path="/dc" element={<DeliveryChallansPage />} />
                <Route path="/dc/new" element={<DCForm />} />
                <Route path="/dc/new/manual" element={<ManualDCForm />} />
                <Route path="/dc/:id/edit" element={<DCForm />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/invoices/new" element={<InvoiceForm />} />
                <Route path="/settings" element={<SettingsLayout />}>
                  <Route path="parties" element={<PartiesPage />} />
                  <Route path="job-works" element={<JobWorksPage />} />
                  <Route path="business" element={<BusinessSettingsPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;