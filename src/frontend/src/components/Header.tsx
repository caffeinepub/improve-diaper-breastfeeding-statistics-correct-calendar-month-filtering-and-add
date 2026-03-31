import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";
import LoginButton from "./LoginButton";

export default function Header() {
  const { theme, setTheme } = useTheme();

  const handleLogoClick = () => {
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0"
          onClick={handleLogoClick}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex-shrink-0 overflow-hidden hover:scale-105 transition-transform">
            <img
              src="/assets/F77891B5-207D-4A37-BFC2-E486817DFEB3.PNG"
              alt="Frėjos žurnalas Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent truncate">
              Frėjos žurnalas
            </h1>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground truncate">
                Sekite savo mažylio pažangą
              </p>
              <div className="h-[3px] w-full bg-gradient-to-r from-pink-400 via-purple-500 to-pink-400 rounded-full shadow-sm" />
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Perjungti temą</span>
          </Button>
          <LoginButton />
        </div>
      </div>
    </header>
  );
}
