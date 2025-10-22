"use client";
import React, { useState, FC } from 'react';
import Link from 'next/link'; // REQUIRED for Next.js routing
import { usePathname } from 'next/navigation'; // REQUIRED for client-safe path access
// Using lucide icons for menu and navigation
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
 * Uses <Link> for proper Next.js internal navigation and usePathname for safe active state.
 */
export const Navbar: FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false); 
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    // FIXED: Use the client-safe hook for determining the current path
    const currentPage = usePathname();

    const getLinkClass = (href: string) => {
        // Check for exact match (e.g., /home)
        const isExactMatch = currentPage === href;

        // Check for subdirectory match (e.g., /xml-generator/details) but exclude root '/'
        const isSubdirectoryMatch = href !== '/' && currentPage.startsWith(href);
        
        const isActive = isExactMatch || isSubdirectoryMatch;

        return `inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold 
                transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500
                ${isActive
                    ? 'bg-teal-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-teal-400'
                }`;
    };

    return (
        <nav className="bg-gray-900 border-b border-teal-500/30 text-white shadow-xl sticky top-0 z-50 rounded-b-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    
                    {/* Brand Logo/Title */}
                    <div className="flex-shrink-0">
                        <Link href="/" 
                            className="flex items-center text-3xl font-extrabold text-teal-400 hover:text-teal-300 transition duration-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                            Sitemap Tools Kit
                        </Link>
                    </div>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex space-x-2 lg:space-x-4 items-center">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.href}
                                href={link.href}
                                // Apply the class based on the client-safe pathname
                                className={getLinkClass(link.href)}
                            >
                                <link.Icon className="w-4 h-4 mr-2" />
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile Menu Button (Hamburger/X Icon) */}
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
                <div className="md:hidden absolute top-20 left-0 w-full z-40 bg-gray-900/95 backdrop-blur-sm" id="mobile-menu">
                    <div className="px-2 pt-2 pb-3 space-y-2 sm:px-3 shadow-lg">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href} 
                                onClick={toggleMenu} // Close menu on link click
                                className={getLinkClass(link.href).replace('inline-flex', 'flex w-full text-left')}
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
interface AppLayoutProps { children: React.ReactNode; }

/**
 * The structural wrapper for the entire application content, including the footer.
 * This component is EXPORTED as a named export for use in Next.js RootLayout.
 */
export const AppLayout: FC<AppLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-900 font-sans text-white">
            <Navbar />
            
            {/* Main content wrapper */}
            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                {children}
            </main>

            {/* Footer added for complete layout */}
            <footer className="w-full bg-gray-900 border-t border-teal-500/10 mt-10 p-6 text-center text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} Sitemap Tools Kit. Built with love and code.
            </footer>
        </div>
    );
};
