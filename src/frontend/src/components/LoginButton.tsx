import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, LogIn, LogOut } from "lucide-react";
import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error("Login error:", error);
        if (error.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <Button
      onClick={handleAuth}
      disabled={disabled}
      variant={isAuthenticated ? "outline" : "default"}
      size="sm"
      className="gap-2"
    >
      {disabled ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Jungiamasi...
        </>
      ) : isAuthenticated ? (
        <>
          <LogOut className="h-4 w-4" />
          Atsijungti
        </>
      ) : (
        <>
          <LogIn className="h-4 w-4" />
          Prisijungti
        </>
      )}
    </Button>
  );
}
