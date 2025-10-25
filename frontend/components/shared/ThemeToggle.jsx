"use client";
import React, { FC } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext.jsx'; // Make sure the path matches where you put ThemeContext

/**
 * A simple toggle button component that switches
 * between light and dark themes.
 */
export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme(); 

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-slate-500 dark:text-slate-300
                 hover:text-slate-900 hover:bg-slate-200 
                 dark:hover:bg-slate-800 dark:hover:text-white
                 transition-all duration-300
                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
};
