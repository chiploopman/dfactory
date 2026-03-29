import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <App />
        <Toaster position="top-center" />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
);
