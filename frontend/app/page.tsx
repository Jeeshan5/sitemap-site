"use client";
import React, { FC } from "react";
import Link from "next/link";
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
 * The main content component for the Home route (/)
 */
const HomePage: FC = () => {
  return (
    <div className="bg-gray-800 p-8 md:p-12 rounded-2xl shadow-2xl border border-teal-500/20 text-center">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 mb-10">
        Choose Your Sitemap Tool
      </h1>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {generatorLinks.map((link) => (
          <Link
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
            <p className="text-sm text-gray-400 font-medium">
              {link.label.split(" ")[0]} Tool
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
