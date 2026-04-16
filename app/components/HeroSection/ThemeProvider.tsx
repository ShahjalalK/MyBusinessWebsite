"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// নিচের এই লাইনটি পরিবর্তন করা হয়েছে
import { type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}