import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useStorageInit } from "./hooks/useStorageInit";
import { isConfigured } from "@/lib/supabaseClient";
import Home from "./pages/Home";
import PropertyDetail from "./pages/PropertyDetail";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProperties from "./pages/AdminProperties";
import Guideline from "./pages/Guideline";
import NotFound from "./pages/NotFound";
import { AlertCircle } from "lucide-react";

const queryClient = new QueryClient();

const AppContent = () => {
  // Initialize storage bucket on app load
  useStorageInit();

  // Check if Supabase is configured
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-red-200 p-8 max-w-md w-full">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-bold text-red-900 mb-2">Configuration Error</h2>
              <p className="text-red-800 mb-4">
                Supabase credentials are not properly configured. Please check:
              </p>
              <ul className="text-sm text-red-700 space-y-2 mb-4">
                <li>• VITE_SUPABASE_URL environment variable</li>
                <li>• VITE_SUPABASE_KEY environment variable</li>
              </ul>
              <p className="text-xs text-red-600">
                Contact your administrator to configure the application.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/guideline" element={<Guideline />} />
        <Route path="/" element={<Home />} />
        <Route path="/property/:propertyId" element={<PropertyDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/properties" element={<AdminProperties />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

const rootElement = document.getElementById("root");
if (rootElement) {
  console.log("[App] Rendering app to root element");
  createRoot(rootElement).render(<App />);
} else {
  console.error("[App] Root element not found!");
}
