import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Initialize gradient settings on app load
  useEffect(() => {
    // Load gradient settings from localStorage and apply them
    const loadGradientSettings = () => {
      try {
        const stored = localStorage.getItem('soundwave-gradient-settings');
        if (stored) {
          const settings = JSON.parse(stored);
          const root = document.documentElement;
          
          // Apply the gradient
          const gradient = `linear-gradient(${settings.direction}deg, ${settings.primary}, ${settings.secondary})`;
          root.style.setProperty('--gradient-primary', gradient);
          root.style.setProperty('--gradient-player', gradient);
          
          // Update primary colors to match the gradient
          const hexToHsl = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h = 0, s = 0;
            const l = (max + min) / 2;
            
            if (max !== min) {
              const d = max - min;
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
              switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
              }
              h /= 6;
            }
            
            return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
          };
          
          try {
            const [h1, s1, l1] = hexToHsl(settings.primary);
            const glowL = Math.min(l1 + 15, 100);
            
            root.style.setProperty('--primary', `${h1} ${s1}% ${l1}%`);
            root.style.setProperty('--player-accent', `${h1} ${s1}% ${l1}%`);
            root.style.setProperty('--audio-progress', `${h1} ${s1}% ${l1}%`);
            root.style.setProperty('--primary-glow', `${h1} ${s1}% ${glowL}%`);
            root.style.setProperty('--player-accent-glow', `${h1} ${s1}% ${glowL}%`);
            
            console.log('🎨 Applied saved gradient settings on app load');
          } catch (error) {
            console.warn('⚠️ Could not parse saved gradient colors');
          }
        }
      } catch (error) {
        console.error('❌ Error loading gradient settings on app start:', error);
      }
    };

    loadGradientSettings();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
