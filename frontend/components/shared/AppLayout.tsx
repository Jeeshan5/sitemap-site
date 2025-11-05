"use client";

import React, { useState, FC } from "react";
import Link from "next/link";
// IMPORT FIX: Use usePathname for reliable route checking
import { Menu, X, Code, Home, List, Trello, LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

// --- 1. Navigation Data ---
interface NavLink {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const navLinks: NavLink[] = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/xml-generator", label: "XML Sitemap Generator", Icon: Code },
  { href: "/html-generator", label: "HTML Sitemap Generator", Icon: List },
  { href: "/visual-builder", label: "Visual Sitemap Builder", Icon: Trello },
];

/**
 * A modern, responsive Navbar component with high-contrast Orange accents.
 */
export const Navbar: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  // FIX: Get the current path reliably using the hook
  const currentPath = usePathname() || "/"; 

  const getLinkClass = (href: string) => {
    // Determine the base path for comparison (e.g., '/xml-generator')
    const basePath = href === '/' ? '/' : href.split('?')[0];

    // FIX: Simplified logic to determine active state
    // 1. Is it an exact match?
    // 2. Or is it a subdirectory match (but not for the home page)?
    const isActive = 
      currentPath === basePath || 
      (basePath !== '/' && currentPath.startsWith(basePath));

    return `inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold 
             transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500
             ${
               isActive
                 ? "bg-orange-600 text-white shadow-md"
                 : "text-gray-300 hover:bg-gray-700 hover:text-orange-400"
             }`;
  };

  return (
    <nav className="bg-gray-900 border-b-4 border-orange-500 text-white shadow-2xl sticky top-0 z-50 rounded-b-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo/Title */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="flex items-center text-3xl font-extrabold text-orange-400 hover:text-orange-300 
                          transition duration-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              Sitemap Tools Kit
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-2 lg:space-x-4 items-center">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={getLinkClass(link.href)}>
                <link.Icon className="w-4 h-4 mr-2" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 
                         hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 
                         focus:ring-inset focus:ring-orange-500 transition duration-300"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          className="md:hidden absolute top-20 left-0 w-full z-40 bg-gray-900/95 backdrop-blur-sm"
          id="mobile-menu"
        >
          <div className="px-2 pt-2 pb-3 space-y-2 sm:px-3 shadow-lg">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={getLinkClass(link.href)
                  .replace("inline-flex", "flex w-full text-left")
                  .replace("px-4", "px-3")
                  .replace("py-2", "py-3")}
              >
                <link.Icon className="w-5 h-5 mr-3" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

// --- 3. AppLayout Component ---
interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * The structural wrapper for the entire application content, setting the Orange/White theme.
 */
export const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      <Navbar />

      {/* Main content wrapper */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">{children}</main>

      {/* Footer */}
      <footer className="w-full bg-gray-100 border-t border-orange-200 mt-10 p-6 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Sitemap Tools Kit.
      </footer>
    </div>
  );
};

export default AppLayout;