import Link from 'next/link';
import { Settings, Code, Zap } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="text-center py-16 px-4 sm:px-6 lg:px-8">
      <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight sm:text-6xl">
        Sitemap Tools Kit
      </h1>
      <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
        Your comprehensive suite for generating XML, HTML, and Visual Sitemaps, boosting SEO and UX planning.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 max-w-5xl mx-auto">
        
        {/* XML Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition duration-300">
          <Code className="h-10 w-10 text-teal-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">XML Generator</h2>
          <p className="mt-2 text-gray-500">
            Crawl your site and generate a valid sitemap.xml file for search engines.
          </p>
          <Link href="/xml-generator" className="mt-4 inline-block text-teal-600 hover:text-teal-800 font-medium">
            Start Generating &rarr;
          </Link>
        </div>

        {/* HTML Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition duration-300">
          <Zap className="h-10 w-10 text-orange-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">HTML Generator</h2>
          <p className="mt-2 text-gray-500">
            Create user-friendly, nested HTML sitemaps for navigation and accessibility.
          </p>
          <Link href="/html-generator" className="mt-4 inline-block text-orange-600 hover:text-orange-800 font-medium">
            Start Building &rarr;
          </Link>
        </div>

        {/* Visual Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition duration-300">
          <Settings className="h-10 w-10 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Visual Builder</h2>
          <p className="mt-2 text-gray-500">
            Map out site hierarchy visually for planning and collaboration.
          </p>
          <Link href="/visual-builder" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">
            Start Mapping &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
