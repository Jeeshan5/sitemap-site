"use client";
import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the context with a default value (will be validated in the hook)
const ThemeContext = createContext(undefined);

/**
 * The ThemeProvider component that wraps your application.
 * It manages the theme state, saves it to localStorage,
 * and applies the 'dark' class to the <html> element.
 */
export const ThemeProvider = ({ children }) => {
  // Start theme as undefined to prevent hydration mismatch
  const [theme, setThemeState] = useState(undefined);

  // Effect to run on initial mount to load the theme (client-side only)
  useEffect(() => {
    const savedTheme = window.localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Determine the initial theme
    const initialTheme = savedTheme ? savedTheme : (prefersDark ? 'dark' : 'light');
    setThemeState(initialTheme);
  }, []); 

  // Effect to run whenever the theme state changes (and is defined)
  useEffect(() => {
    if (theme === undefined) {
      return;
    }
    
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem('theme', theme);
  }, [theme]); 

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  // Prevent children from rendering until the theme is determined (client-side)
  if (theme === undefined) {
    return null; // Prevents hydration mismatches
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to easily access the theme context (theme and setTheme)
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
