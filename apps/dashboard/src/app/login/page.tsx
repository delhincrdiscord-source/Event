"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gamepad2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@gameverse/ui/input";
import { Label } from "@gameverse/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@gameverse/auth/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdminMode = searchParams.get("mode") === "admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error: authError } = await authClient.signIn.email({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  function handleDiscordLogin() {
    setIsLoading(true);
    setError("");
    window.location.href = "/api/auth/login/discord";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Gamepad2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              {isAdminMode ? "Admin Sign In" : "Welcome to Gameverse"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAdminMode
                ? "Sign in with your admin credentials"
                : "Sign in with Discord to access your dashboard"}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">
              {isAdminMode ? "Sign in" : "Continue with Discord"}
            </CardTitle>
            <CardDescription>
              {isAdminMode
                ? "Enter your credentials to access the dashboard"
                : "Connect your Discord account to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Discord OAuth — direct navigation */}
            <Button
              variant={isAdminMode ? "outline" : "default"}
              className="w-full"
              onClick={handleDiscordLogin}
              disabled={isLoading}
            >
              {isLoading && !isAdminMode ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4 fill-current" viewBox="0 0 127.14 96.36">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,0,106,106,0,0,0,22.8,8.07,108.38,108.38,0,0,0,2.15,73A105.81,105.81,0,0,0,34.2,89.17,77.7,77.7,0,0,0,40.75,78.5a69.83,69.83,0,0,1-11-5.26c.92-.67,1.83-1.37,2.71-2.09a74,74,0,0,0,62.24,0c.89.72,1.79,1.42,2.71,2.09a70,70,0,0,1-11,5.27,77.84,77.84,0,0,0,6.55,10.66,105.62,105.62,0,0,0,32.06-16.17A108.29,108.29,0,0,0,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5.07-12.72,11.45-12.72c6.43,0,11.58,5.77,11.45,12.72C53.9,60,48.78,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.07-12.72,11.44-12.72C91.12,40.28,96.28,46,96.14,53,96.14,60,91.06,65.69,84.69,65.69Z" />
                </svg>
              )}
              Sign in with Discord
            </Button>

            {/* Admin mode: email/password form */}
            {isAdminMode && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or sign in with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-2">
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Back to Gameverse
            </Link>
          </p>
          {!isAdminMode && (
            <p className="text-center text-xs text-muted-foreground">
              <Link
                href="/login?mode=admin"
                className="hover:text-foreground transition-colors"
              >
                Admin login →
              </Link>
            </p>
          )}
          {isAdminMode && (
            <p className="text-center text-xs text-muted-foreground">
              <Link
                href="/login"
                className="hover:text-foreground transition-colors"
              >
                ← Participant login
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
