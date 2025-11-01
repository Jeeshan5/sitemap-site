"use client";
import React, { FC } from "react";
import { motion } from "framer-motion";
import { Code, List, Trello, LucideIcon } from "lucide-react";

interface GeneratorLink {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const generatorLinks: GeneratorLink[] = [
  { href: "/xml-generator", label: "XML Sitemap Generator", Icon: Code },
  { href: "/html-generator", label: "HTML Sitemap Generator", Icon: List },
  { href: "/visual-builder", label: "Visual Sitemap Builder", Icon: Trello },
];

const HomePage: FC = () => {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-200 overflow-hidden">
      {/* Animated gradient background orbs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 -z-10"
      >
        <div className="absolute w-96 h-96 bg-orange-400 rounded-full blur-3xl opacity-30 top-20 left-10 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-red-400 rounded-full blur-3xl opacity-30 bottom-20 right-10 animate-pulse delay-200"></div>
      </motion.div>

      {/* Card container */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white/70 backdrop-blur-lg border border-orange-200 p-10 md:p-14 rounded-3xl shadow-2xl text-center max-w-6xl w-[90%]"
      >
        <motion.h1
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-12"
        >
          Choose Your Sitemap Tool
        </motion.h1>

        {/* Cards with hover animations */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {generatorLinks.map((link, i) => (
            <motion.a
              key={link.href}
              href={link.href}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              whileHover={{
                scale: 1.08,
                rotate: 1,
              }}
              whileTap={{ scale: 0.97 }}
              className="flex flex-col items-center justify-center p-8 h-52 bg-white rounded-2xl border border-orange-200 
                         hover:border-orange-500 hover:shadow-orange-400/30 hover:shadow-2xl transition-all duration-300 group"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8 }}
              >
                <link.Icon className="w-12 h-12 mb-4 text-orange-500 group-hover:text-orange-600 transition-colors" />
              </motion.div>

              <h2 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-orange-500 transition-colors">
                {link.label}
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                {link.label.split(" ")[0]} Tool
              </p>
            </motion.a>
          ))}
        </div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-14 text-gray-700 max-w-3xl mx-auto leading-relaxed"
        >
          <p>
            Select a tool above to begin generating your site structure. Whether
            you need an{" "}
            <span className="font-semibold text-orange-600">XML file</span> for
            search engines, a clean{" "}
            <span className="font-semibold text-orange-600">HTML list</span> for
            visitors, or a{" "}
            <span className="font-semibold text-orange-600">
              visual overview
            </span>{" "}
            for planning — we’ve built a bright, modern, and intuitive
            experience for you.
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
};

export default HomePage;
