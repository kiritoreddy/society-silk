import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocietyProvider } from "@/contexts/SocietyContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SelectSociety from "./pages/SelectSociety";
import Dashboard from "./pages/Dashboard";
import DayBook from "./pages/DayBook";
import Members from "./pages/Members";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SocietyProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/select-society" element={<SelectSociety />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/day-book" element={<DayBook />} />
              <Route path="/members" element={<Members />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SocietyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
