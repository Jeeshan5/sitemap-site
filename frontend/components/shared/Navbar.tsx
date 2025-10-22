"use client";
import React, { useState } from 'react';
// Using lucide icons for menu and navigation
import { Menu, X, Code, Home, List, Trello } from 'lucide-react'; 

// --- 1. Navigation Data ---
const navLinks = [
    { href: '/', label: 'Home', Icon: Home },
    { href: '/xml-generator', label: 'XML Sitemap Generator', Icon: Code },
    { href: '/html-generator', label: 'HTML Sitemap Generator', Icon: List },
    { href: '/visual-builder', label: 'Visual Sitemap Builder', Icon: Trello },
];

/**
 * A modern, responsive, and beautifully designed Navbar component.
 */
const Navbar = () => {
    // State to manage the visibility of the mobile menu
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <nav className="bg-gray-900 border-b border-teal-500/30 text-white shadow-xl sticky top-0 z-50 rounded-b-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    
                    {/* Brand Logo/Title */}
                    <div className="flex-shrink-0">
                        <a href="/" 
                           className="flex items-center text-3xl font-extrabold text-teal-400 hover:text-teal-300 transition duration-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                            Sitemap Tools Kit
                        </a>
                    </div>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex space-x-2 lg:space-x-4 items-center">
                        {navLinks.map((link) => (
                            <a 
                                key={link.href}
                                href={link.href}
                                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold 
                                           text-gray-300 hover:bg-gray-700 hover:text-teal-400 
                                           transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={toggleMenu} // Close menu on link click
                                className="flex items-center w-full px-3 py-3 rounded-xl text-base font-medium 
                                           text-gray-300 hover:bg-gray-700 hover:text-teal-400 
                                           transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500"
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


// Define the expected props structure for TypeScript
interface AppLayoutProps {
    children: React.ReactNode;
}

/**
 * The structural wrapper for the entire application content, including the footer.
 * Using inline type definition for props to resolve strict linting errors.
 */
const AppLayout = ({ children }: { children: React.ReactNode }) => {
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


// --- 4. Main App Component (Renders Layout with focused buttons) ---
const App = () => {
    // Filter out the 'Home' link so only the generator links remain for the buttons
    const generatorLinks = navLinks.filter(link => link.href !== '/');

    return (
        <AppLayout children={
            <div className="bg-gray-800 p-8 md:p-12 rounded-2xl shadow-2xl border border-teal-500/20 text-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 mb-10">
                    Choose Your Sitemap Tool
                </h1>
                
                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {generatorLinks.map((link) => (
                        <a 
                            // This code generates the three large buttons.
                            key={link.href}
                            href={link.href}
                            className="flex flex-col items-center justify-center p-8 h-48 bg-gray-700 rounded-xl 
                                       transition duration-300 transform hover:scale-105 hover:bg-gray-700/80
                                       shadow-lg hover:shadow-teal-500/50 hover:shadow-2xl group border border-gray-600 hover:border-teal-500"
                        >
                            <link.Icon className="w-10 h-10 mb-3 text-teal-400 group-hover:text-cyan-400 transition-colors" />
                            <h2 className="text-xl font-bold text-white mb-1 group-hover:text-teal-300 transition-colors">
                                {link.label}
                            </h2>
                            <p className="text-sm text-gray-400 font-medium">{link.label.split(' ')[0]} Tool</p>
                        </a>
                    ))}
                </div>
            </div>
        } />
    );
};

export default App;
