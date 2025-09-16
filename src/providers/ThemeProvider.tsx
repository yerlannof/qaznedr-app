'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
interface ThemeProviderProps {
  children: React.ReactNode;
  [key: string]: any;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      storageKey="qaznedr-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
