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

const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] as any },
  }),
};

const HomePage: FC = () => {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-gradient-to-b from-orange-50 via-white to-red-50">
      {/* Floating glowing orbs with parallax movement */}
      <motion.div
        className="absolute inset-0 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 2 }}
      >
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -40, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-96 h-96 bg-gradient-to-r from-orange-300 to-pink-400 rounded-full blur-3xl opacity-30 top-10 left-10"
        />
        <motion.div
          animate={{
            x: [0, -30, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-96 h-96 bg-gradient-to-r from-red-300 to-orange-500 rounded-full blur-3xl opacity-25 bottom-10 right-10"
        />
      </motion.div>

      {/* Card container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.8, ease: "easeOut" }}
        className="relative z-10 bg-white/80 backdrop-blur-xl border border-orange-200 p-10 md:p-14 rounded-3xl shadow-2xl text-center max-w-6xl w-[90%]"
      >
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-12"
        >
          Choose Your Sitemap Tool
        </motion.h1>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {generatorLinks.map((link, i) => (
            <motion.a
              key={link.href}
              href={link.href}
              variants={fadeInUp}
              custom={i}
              initial="hidden"
              animate="visible"
              whileHover={{
                  scale: 1.12,
                  rotate: [0, 2, -2, 0],
                  boxShadow: "0px 0px 30px rgba(255, 125, 50, 0.3)",
                  transition: { duration: 0.12 }
                }}
              whileTap={{ scale: 0.95 }}
              className="relative flex flex-col items-center justify-center p-8 h-56 bg-white rounded-2xl border border-orange-200 
                         hover:border-orange-500 hover:shadow-orange-400/40 transition-all duration-500 group overflow-hidden"
            >
              {/* Animated glow on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-orange-400/10 via-red-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"
              ></motion.div>

              {/* Icon rotation */}
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.9 }}
              >
                <link.Icon className="w-14 h-14 mb-4 text-orange-500 group-hover:text-orange-600 transition-colors" />
              </motion.div>

              <h2 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-orange-600 transition-colors">
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
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-14 text-gray-700 max-w-3xl mx-auto leading-relaxed"
        >
          <p className="text-lg">
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
