"use client";
import React, { useState, FC, useEffect } from 'react';
// FIX: Using standard HTML imports/types instead of Next.js for compatibility
import { Menu, X, Code, Home, List, Trello, LucideIcon } from 'lucide-react'; 

// --- 1. Navigation Data ---
interface NavLink {
    href: string;
    label: string;
    Icon: LucideIcon;
}

const navLinks: NavLink[] = [
    { href: '/', label: 'Home', Icon: Home },
    { href: '/xml-generator', label: 'XML Sitemap Generator', Icon: Code },
    { href: '/html-generator', label: 'HTML Sitemap Generator', Icon: List },
    { href: '/visual-builder', label: 'Visual Sitemap Builder', Icon: Trello },
];

/**
 * A modern, responsive Navbar component with high-contrast Orange accents.
 * FIX: Hydration error resolved by using useEffect to determine the current path.
 */
export const Navbar: FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false); 
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    // FIX 1: Initialize path to '/' for server rendering/initial mount
    const [currentPage, setCurrentPage] = useState('/');

    // FIX 2: Set the actual path only after the component has mounted (client-side)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentPage(window.location.pathname);
        }
    }, []); 

    const getLinkClass = (href: string) => {
        // Check for exact match or subdirectory match
        const isExactMatch = currentPage === href;
        const isSubdirectoryMatch = href !== '/' && currentPage.startsWith(href);
        const isActive = isExactMatch || isSubdirectoryMatch;

        return `inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold 
                transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500
                ${isActive
                    ? 'bg-orange-600 text-white shadow-md' // Active: Strong orange background
                    : 'text-gray-300 hover:bg-gray-700 hover:text-orange-400' // Inactive: Hover orange accent
                }`;
    };

    return (
        <nav className="bg-gray-900 border-b-4 border-orange-500 text-white shadow-2xl sticky top-0 z-50 rounded-b-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    
                    {/* Brand Logo/Title - Orange Accent */}
                    <div className="flex-shrink-0">
                        <a href="/" 
                            className="flex items-center text-3xl font-extrabold text-orange-400 hover:text-orange-300 
                                       transition duration-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                            Sitemap Tools Kit
                        </a>
                    </div>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex space-x-2 lg:space-x-4 items-center">
                        {navLinks.map((link) => (
                            <a 
                                key={link.href}
                                href={link.href}
                                className={getLinkClass(link.href)}
                            >
                                <link.Icon className="w-4 h-4 mr-2" />
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Mobile Menu Button (Hamburger/X Icon) */}
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

            {/* Mobile Menu (Conditional Rendering) */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full z-40 bg-gray-900/95 backdrop-blur-sm" id="mobile-menu">
                    <div className="px-2 pt-2 pb-3 space-y-2 sm:px-3 shadow-lg">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href} 
                                onClick={toggleMenu} // Close menu on link click
                                className={getLinkClass(link.href).replace('inline-flex', 'flex w-full text-left').replace('px-4', 'px-3').replace('py-2', 'py-3')}
                            >
                                <link.Icon className="w-5 h-5 mr-3" />
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
};

// --- 3. AppLayout Component ---
interface AppLayoutProps { children: React.ReactNode; }

/**
 * The structural wrapper for the entire application content, setting the Orange/White theme.
 */
export const AppLayout: FC<AppLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-white font-sans text-gray-800">
            <Navbar />
            
            {/* Main content wrapper */}
            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                {children}
            </main>

            {/* Footer - Light Gray background with Orange accent border */}
            <footer className="w-full bg-gray-100 border-t border-orange-200 mt-10 p-6 text-center text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} Sitemap Tools Kit.
            </footer>
        </div>
    );
};

export default AppLayout;
