"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      enableColorScheme
      storageKey="trackflowpro-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
