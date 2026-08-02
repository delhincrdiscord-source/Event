"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10"
            >
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Application Error
              </h1>
              <p className="text-muted-foreground">
                A critical error occurred. Please refresh the page.
              </p>
            </div>

            {error.message && (
              <div className="mx-auto max-w-md rounded-md bg-muted p-4">
                <p className="text-sm font-mono text-muted-foreground">
                  {error.message}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" onClick={reset}>
                Refresh Page
              </Button>
              <Button asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
