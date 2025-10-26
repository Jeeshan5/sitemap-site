"use client";
import React, { useState, FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Code, Home, List, MapPin, Globe, Sparkles } from 'lucide-react';

// --- Navigation Data ---
interface NavLink {
    href: string;
    label: string;
    Icon: React.ElementType;
    gradient: string;
}

const navLinks: NavLink[] = [
    { 
        href: '/', 
        label: 'Home', 
        Icon: Home,
        gradient: 'from-purple-500 to-pink-500'
    },
    { 
        href: '/xml-generator', 
        label: 'XML Generator', 
        Icon: Code,
        gradient: 'from-blue-500 to-cyan-500'
    },
    { 
        href: '/html-generator', 
        label: 'HTML Generator', 
        Icon: List,
        gradient: 'from-purple-500 to-pink-500'
    },
    { 
        href: '/visual-builder', 
        label: 'Visual Builder', 
        Icon: MapPin,
        gradient: 'from-indigo-500 to-purple-500'
    },
];

/**
 * Modern, glassmorphic navbar with smooth animations
 */
export const Navbar: FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const currentPage = usePathname();

    const isActiveLink = (href: string) => {
        return currentPage === href || (href !== '/' && currentPage.startsWith(href));
    };

    return (
        <>
            {/* Spacer for fixed navbar */}
            <div className="h-20"></div>
            
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/20 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        
                        {/* Brand Logo */}
                        <Link href="/" 
                            className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                <Globe className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    SitemapForge
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    Professional Sitemap Tools
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-2">
                            {navLinks.map((link) => {
                                const isActive = isActiveLink(link.href);
                                return (
                                    <Link 
                                        key={link.href}
                                        href={link.href}
                                        className={`
                                            relative px-4 py-2 rounded-xl font-semibold text-sm
                                            transition-all duration-300 group
                                            ${isActive 
                                                ? 'text-white' 
                                                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                            }
                                        `}
                                    >
                                        {isActive && (
                                            <span className={`absolute inset-0 bg-gradient-to-r ${link.gradient} rounded-xl shadow-lg`}></span>
                                        )}
                                        <span className="relative flex items-center gap-2">
                                            <link.Icon className="w-4 h-4" />
                                            {link.label}
                                        </span>
                                        {!isActive && (
                                            <span className={`absolute inset-0 bg-gradient-to-r ${link.gradient} rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></span>
                                        )}
                                    </Link>
                                );
                            })}
                            
                            {/* CTA Button */}
                            <button className="ml-4 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Get Started
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMenu}
                            className="md:hidden p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
                        >
                            {isMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-20 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/20 shadow-2xl">
                        <div className="px-4 py-4 space-y-2">
                            {navLinks.map((link) => {
                                const isActive = isActiveLink(link.href);
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={toggleMenu}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm
                                            transition-all duration-300
                                            ${isActive 
                                                ? `bg-gradient-to-r ${link.gradient} text-white shadow-lg` 
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }
                                        `}
                                    >
                                        <link.Icon className="w-5 h-5" />
                                        {link.label}
                                    </Link>
                                );
                            })}
                            <button className="w-full mt-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-lg flex items-center justify-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Get Started
                            </button>
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
};

// --- AppLayout Component ---
interface AppLayoutProps { 
    children: React.ReactNode; 
}

/**
 * Modern app layout with gradient backgrounds and professional footer
 */
export const AppLayout: FC<AppLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-950">
            <Navbar />
            
            {/* Main content */}
            <main className="relative">
                {/* Decorative gradient blobs */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                
                <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>

            {/* Modern Footer */}
            <footer className="relative mt-20 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        
                        {/* Brand Section */}
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <Globe className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    SitemapForge
                                </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 max-w-md">
                                Professional sitemap generation tools for modern web developers. Create XML, HTML, and visual sitemaps with ease.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gradient-to-br hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-300">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                                </a>
                                <a href="#" className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gradient-to-br hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-300">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                </a>
                                <a href="#" className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gradient-to-br hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-300">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Tools</h3>
                            <ul className="space-y-2">
                                {navLinks.map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Resources */}
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Resources</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">Documentation</a></li>
                                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">API Reference</a></li>
                                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">Support</a></li>
                                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">Contact Us</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            © {new Date().getFullYear()} SitemapForge. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm">
                            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</a>
                            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</a>
                            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Cookies</a>
                        </div>
                    </div>
                </div>
            </footer>

            <style jsx global>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
};