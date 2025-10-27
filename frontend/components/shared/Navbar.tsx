// "use client";
// import React, { useState, FC } from 'react';
// // FIX: Removed 'next/link' as it causes resolution errors outside a Next.js environment.
// // Using standard 'a' tags instead, which Link wraps anyway.
// // FIX: Removed 'next/navigation' as it causes resolution errors.
// import { Menu, X, Code, Home, List, Trello, LucideIcon } from 'lucide-react'; 

// // --- 1. Navigation Data ---
// interface NavLink {
//     href: string;
//     label: string;
//     Icon: LucideIcon;
// }

// const navLinks: NavLink[] = [
//     { href: '/', label: 'Home', Icon: Home },
//     { href: '/xml-generator', label: 'XML Sitemap Generator', Icon: Code },
//     { href: '/html-generator', label: 'HTML Sitemap Generator', Icon: List },
//     { href: '/visual-builder', label: 'Visual Sitemap Builder', Icon: Trello },
// ];

// /**
//  * A modern, responsive, and beautifully designed Navbar component with Orange accents.
//  */
// const Navbar: FC = () => {
//     const [isMenuOpen, setIsMenuOpen] = useState(false);
//     const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

//     // FIX: Replaced usePathname() with client-side window.location.pathname for compatibility.
//     // Ensure this is only accessed when window object is defined.
//     const currentPage = typeof window !== 'undefined' ? window.location.pathname : '/';

//     const getLinkClass = (href: string) => {
//         // Check for exact match (e.g., /home)
//         const isExactMatch = currentPage === href;

//         // Check for subdirectory match (e.g., /xml-generator/details) but exclude root '/'
//         const isSubdirectoryMatch = href !== '/' && currentPage.startsWith(href);
        
//         const isActive = isExactMatch || isSubdirectoryMatch;

//         return `inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold 
//                 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500
//                 ${isActive
//                     ? 'bg-orange-600 text-white shadow-md' // Active: Strong orange background
//                     : 'text-gray-300 hover:bg-gray-700 hover:text-orange-400' // Inactive: Hover orange accent
//                 }`;
//     };

//     return (
//         // Navbar kept dark for strong contrast against the light body
//         <nav className="bg-gray-900 border-b-4 border-orange-500 text-white shadow-2xl sticky top-0 z-50 rounded-b-lg">
//             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//                 <div className="flex items-center justify-between h-20">
                    
//                     {/* Brand Logo/Title - Orange Accent */}
//                     <div className="flex-shrink-0">
//                         {/* FIX: Replaced <Link> with <a> tag */}
//                         <a 
//                             href="/" 
//                             className="flex items-center text-3xl font-extrabold text-orange-400 hover:text-orange-300 
//                                        transition duration-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
//                         >
//                             Sitemap Tools Kit
//                         </a>
//                     </div>

//                     {/* Desktop Navigation Links */}
//                     <div className="hidden md:flex space-x-2 lg:space-x-4 items-center">
//                         {navLinks.map((link) => (
//                             // FIX: Replaced <Link> with <a> tag
//                             <a 
//                                 key={link.href}
//                                 href={link.href}
//                                 className={getLinkClass(link.href)}
//                             >
//                                 <link.Icon className="w-4 h-4 mr-2" />
//                                 {link.label}
//                             </a>
//                         ))}
//                     </div>

//                     {/* Mobile Menu Button (Hamburger/X Icon) - Orange Focus */}
//                     <div className="flex md:hidden">
//                         <button
//                             onClick={toggleMenu}
//                             type="button"
//                             className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 
//                                      hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 
//                                      focus:ring-inset focus:ring-orange-500 transition duration-300"
//                             aria-controls="mobile-menu"
//                             aria-expanded={isMenuOpen}
//                         >
//                             <span className="sr-only">Open main menu</span>
//                             {isMenuOpen ? (
//                                 <X className="block h-6 w-6" aria-hidden="true" />
//                             ) : (
//                                 <Menu className="block h-6 w-6" aria-hidden="true" />
//                             )}
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             {/* Mobile Menu (Conditional Rendering) */}
//             {isMenuOpen && (
//                 <div className="md:hidden absolute top-20 left-0 w-full z-40 bg-gray-900/95 backdrop-blur-sm" id="mobile-menu">
//                     <div className="px-2 pt-2 pb-3 space-y-2 sm:px-3 shadow-lg">
//                         {navLinks.map((link) => (
//                             // FIX: Replaced <Link> with <a> tag
//                             <a
//                                 key={link.href}
//                                 href={link.href}
//                                 onClick={toggleMenu} // Close menu on link click
//                                 // Adjusting classes for mobile full-width links
//                                 className={getLinkClass(link.href).replace('inline-flex', 'flex w-full text-left').replace('px-4', 'px-3').replace('py-2', 'py-3')}
//                             >
//                                 <link.Icon className="w-5 h-5 mr-3" />
//                                 {link.label}
//                             </a>
//                         ))}
//                     </div>
//                 </div>
//             )}
//         </nav>
//     );
// };

// // --- 3. Main App Component (Combining AppLayout and Content) ---
// /**
//  * The main application wrapper component.
//  * This acts as the entry point and default layout.
//  */
// export default function App() {
//     return (
//         // The main layout is switched to white/light mode (bg-white)
//         <div className="min-h-screen bg-white font-sans text-gray-800">
//             <Navbar />
            
//             {/* Main content area */}
//             <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
//                 {/* This is where your page content would be rendered. 
//                   Adding a placeholder card to demonstrate the orange/white theme contrast.
//                 */}
//                 <div className="p-8 bg-gray-50 rounded-xl shadow-lg border border-orange-100">
//                     <h1 className="text-3xl font-bold text-orange-600 mb-4">Welcome to the Sitemap Tools Kit</h1>
//                     <p className="text-gray-700">
//                         This is a placeholder for your main application content. The light background (white/gray-50) 
//                         provides a clean contrast to the bold orange accents in the navigation bar.
//                     </p>
//                     <button className="mt-6 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 transition duration-300 focus:outline-none focus:ring-4 focus:ring-orange-300">
//                         Get Started
//                     </button>
//                 </div>
//             </main>

//             {/* Footer added for complete layout - Orange accent on border */}
//             <footer className="w-full bg-gray-100 border-t-2 border-orange-100 mt-10 p-6 text-center text-gray-500 text-sm">
//                 &copy; {new Date().getFullYear()} Sitemap Tools Kit. Built with code and a vibrant touch of orange.
//             </footer>
//         </div>
//     );
// };
