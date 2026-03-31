import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <p>© 2025. Frėjytei mūsų, sukurta tečio</p>
        </div>
      </div>
    </footer>
  );
}
