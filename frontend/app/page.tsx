"use client";
import React, { FC } from "react";
// FIX: Using standard HTML imports/types instead of Next.js for compatibility
// import Link from "next/link";
import { Code, List, Trello, LucideIcon } from "lucide-react";

// --- Generator Data (Filtered for Home Buttons) ---
interface GeneratorLink {
    href: string;
    label: string;
    Icon: LucideIcon;
}

/**
 * Links to the three sitemap tools
 */
const generatorLinks: GeneratorLink[] = [
    { href: "/xml-generator", label: "XML Sitemap Generator", Icon: Code },
    { href: "/html-generator", label: "HTML Sitemap Generator", Icon: List },
    { href: "/visual-builder", label: "Visual Sitemap Builder", Icon: Trello },
];

/**
 * The main content component for the Home route (/) - Now Orange/White themed.
 */
const HomePage: FC = () => {
    return (
        // Outer card changed from dark gray to light gray/white
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-orange-200 text-center">
            
            {/* Title changed from Teal/Cyan gradient to Orange gradient */}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 mb-12">
                Choose Your Sitemap Tool
            </h1>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {generatorLinks.map((link) => (
                    // FIX: Replaced <Link> with <a>
                    <a
                        key={link.href}
                        href={link.href}
                        className="flex flex-col items-center justify-center p-8 h-48 bg-gray-50 rounded-xl 
                                     transition duration-300 transform hover:scale-105 hover:bg-orange-50 
                                     shadow-lg hover:shadow-orange-400/50 hover:shadow-2xl group border border-gray-200 hover:border-orange-500"
                    >
                        {/* Icon color changed from Teal to Orange */}
                        <link.Icon className="w-10 h-10 mb-3 text-orange-500 group-hover:text-orange-600 transition-colors" />
                        
                        {/* Heading text color changed from White to Dark Gray/Orange */}
                        <h2 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-orange-500 transition-colors">
                            {link.label}
                        </h2>
                        
                        {/* Subtext color adjusted for light theme */}
                        <p className="text-sm text-gray-500 font-medium">
                            {link.label.split(" ")[0]} Tool
                        </p>
                    </a>
                ))}
            </div>
            
            <div className="mt-12 text-gray-700 max-w-3xl mx-auto">
                <p>
                    Select a tool above to begin generating your site structure. Whether you need an **XML file** for search engines, a clean **HTML list** for visitors, or a **visual overview** for planning, we have you covered with a bright, clean, and intuitive interface.
                </p>
            </div>
        </div>
    );
};

export default HomePage;
