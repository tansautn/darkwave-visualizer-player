import {Toaster} from "@/components/ui/sonner";
import {TooltipProvider} from "@/components/ui/tooltip";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import {navItems} from "./nav-items";
import {useEffect} from "react";
import {checkAndClearPlaylist} from "./utils/versionCheck";
import {InteractionProvider} from '@/providers/InteractionProvider.jsx';

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    checkAndClearPlaylist();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <InteractionProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {navItems.map(({ to, page }) => (
            <Route key={to} path={to} element={page} />
            ))}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </InteractionProvider>
  </QueryClientProvider>
  );
};

export default App;
