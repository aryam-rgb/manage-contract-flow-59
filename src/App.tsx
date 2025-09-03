
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Bootstrap from "./pages/Bootstrap";
import Index from "./pages/Index";
import Contracts from "./pages/Contracts";
import Templates from "./pages/Templates";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import CreateContract from "./pages/CreateContract";
import ScheduleReview from "./pages/ScheduleReview";
import ReviewContract from "./pages/ReviewContract";
import ContractDetails from "./pages/ContractDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const MainApp = () => {
  const { user, signOut, userRole, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show bootstrap or auth page
  if (!user) {
    return (
      <Routes>
        <Route path="/bootstrap" element={<Bootstrap />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  // If authenticated, show main app with sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 bg-card border-b border-border flex items-center px-6">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-xl font-semibold text-foreground">KCB Bank Contracts</h1>
            <div className="ml-auto flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {user.email} {userRole && `(${userRole})`}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/contracts/create" element={<CreateContract />} />
              <Route path="/contracts/:id" element={<ContractDetails />} />
              <Route path="/contracts/:id/edit" element={<CreateContract />} />
              <Route path="/create-contract" element={<CreateContract />} />
              <Route path="/schedule-review" element={<ScheduleReview />} />
              <Route path="/contracts/review/:id" element={<ReviewContract />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
