"use client";
import React, { FC } from "react";
import Link from "next/link";
import { Code, List, MapPin, ArrowRight, Zap, Shield, Globe, Sparkles, CheckCircle } from "lucide-react";

// --- Generator Data ---
interface GeneratorCard {
  href: string;
  title: string;
  description: string;
  Icon: React.ElementType;
  gradient: string;
  features: string[];
}

const generatorCards: GeneratorCard[] = [
  { 
    href: "/xml-generator", 
    title: "XML Sitemap", 
    description: "Generate SEO-friendly XML sitemaps for search engines",
    Icon: Code,
    gradient: "from-blue-500 to-cyan-500",
    features: ["Google Compatible", "Auto Priority", "Last Modified"]
  },
  { 
    href: "/html-generator", 
    title: "HTML Sitemap", 
    description: "Create beautiful, nested HTML sitemaps for visitors",
    Icon: List,
    gradient: "from-purple-500 to-pink-500",
    features: ["User-Friendly", "Nested Links", "Accessible"]
  },
  { 
    href: "/visual-builder", 
    title: "Visual Builder", 
    description: "Interactive whiteboard-style visual sitemap creator",
    Icon: MapPin,
    gradient: "from-indigo-500 to-purple-500",
    features: ["Drag & Drop", "Real-time", "Export PNG"]
  },
];

/**
 * Modern, feature-rich homepage with hero section
 */
const HomePage: FC = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            Professional Sitemap Tools
          </span>
        </div>
        
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight">
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Build Perfect
          </span>
          <br />
          <span className="text-gray-900 dark:text-white">
            Sitemaps in Seconds
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Generate XML, HTML, and visual sitemaps with our powerful suite of tools. 
          Boost your SEO and improve site navigation effortlessly.
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 pt-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">10k+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sitemaps Generated</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">99.9%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">⚡ Fast</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Processing</div>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Choose Your Tool
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Select the perfect sitemap generator for your needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {generatorCards.map((card, index) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-transparent overflow-hidden"
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              
              {/* Icon */}
              <div className={`relative w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                <card.Icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <div className="relative space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 transition-all">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {card.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle className={`w-4 h-4 bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`} style={{ fill: 'currentColor' }} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="flex items-center gap-2 text-sm font-semibold pt-2">
                  <span className={`bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                    Get Started
                  </span>
                  <ArrowRight className={`w-4 h-4 bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent transform group-hover:translate-x-1 transition-transform`} />
                </div>
              </div>

              {/* Corner decoration */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-5 rounded-full blur-3xl transform translate-x-16 -translate-y-16`}></div>
            </Link>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-purple-900/20 rounded-3xl p-12 border border-indigo-100 dark:border-gray-700">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Why Choose SitemapForge?
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Built for developers, SEO professionals, and website owners
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Lightning Fast</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Generate complete sitemaps in seconds with our optimized crawler
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Secure & Private</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your data is never stored. We process everything in real-time
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto shadow-lg">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">SEO Optimized</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              100% compliant with Google's sitemap standards and best practices
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to Build Your Sitemap?
        </h2>
        <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
          Join thousands of developers and SEO professionals using SitemapForge to create better sitemaps
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            href="/xml-generator"
            className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Start Creating →
          </Link>
          <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold hover:bg-white/10 transition-all duration-300">
            View Documentation
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;