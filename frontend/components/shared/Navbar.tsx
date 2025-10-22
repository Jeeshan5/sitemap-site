"use client";
import React, { useState, FC } from 'react';
import Link from 'next/link'; // REQUIRED: Import Link component
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
 * A modern, responsive, and beautifully designed Navbar component.
 */
export const Navbar: FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    // Note: We use `window.location.pathname` to simulate active page highlighting, 
    // though Next.js has better hooks for this (`usePathname`).
    const currentPage = typeof window !== 'undefined' ? window.location.pathname : '/';

    return (
        <nav className="bg-gray-900 border-b border-teal-500/30 text-white shadow-xl sticky top-0 z-50 rounded-b-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    
                    {/* Brand Logo/Title - FIXED: Use Link component */}
                    <div className="flex-shrink-0">
                        <Link 
                           href="/" 
                           className="flex items-center text-3xl font-extrabold text-teal-400 hover:text-teal-300 transition duration-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            Sitemap Tools Kit
                        </Link>
                    </div>

                    {/* Desktop Navigation Links - FIXED: Use Link component */}
                    <div className="hidden md:flex space-x-2 lg:space-x-4 items-center">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.href}
                                href={link.href}
                                className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold 
                                            transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 
                                            ${currentPage === link.href || (currentPage.startsWith(link.href) && link.href !== '/')
                                                ? 'bg-teal-700 text-white' 
                                                : 'text-gray-300 hover:bg-gray-700 hover:text-teal-400'
                                            }`}
                            >
                                <link.Icon className="w-4 h-4 mr-2" />
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile Menu Button remains the same */}
                    <div className="flex md:hidden">
                        <button
                            onClick={toggleMenu}
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 
                                       hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 
                                       focus:ring-inset focus:ring-teal-500 transition duration-300"
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
                <div className="md:hidden" id="mobile-menu">
                    <div className="px-2 pt-2 pb-3 space-y-2 sm:px-3 bg-gray-800">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={toggleMenu} // Close menu on link click
                                className={`flex items-center w-full px-3 py-3 rounded-xl text-base font-medium text-left
                                            transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500
                                            ${currentPage === link.href 
                                                ? 'bg-teal-700 text-white' 
                                                : 'text-gray-300 hover:bg-gray-700 hover:text-teal-400'
                                            }`}
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
