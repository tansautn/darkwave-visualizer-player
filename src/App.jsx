import {Toaster} from "@/components/ui/sonner";
import {TooltipProvider} from "@/components/ui/tooltip";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import {navItems} from "./nav-items";
import {InteractionProvider} from '@/providers/InteractionProvider.jsx';
import {PlaybackProvider} from '@/providers/PlaybackProvider.jsx';
import {PlaylistProvider} from '@/providers/PlaylistProvider.jsx';
import {VisualizerProvider} from '@/providers/VisualizerProvider.jsx';

const queryClient = new QueryClient();

const App = () => {
  return (
  <QueryClientProvider client={queryClient}>
    <InteractionProvider>
      <PlaybackProvider>
        <PlaylistProvider>
          <VisualizerProvider>
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
          </VisualizerProvider>
        </PlaylistProvider>
      </PlaybackProvider>
    </InteractionProvider>
  </QueryClientProvider>
  );
};

export default App;
