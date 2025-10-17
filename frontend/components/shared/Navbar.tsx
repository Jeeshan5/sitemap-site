import Link from 'next/link';

// Defines the links for the navigation bar
const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/xml-generator', label: 'XML Sitemap Generator' },
    { href: '/html-generator', label: 'HTML Sitemap Generator' },
    { href: '/visual-builder', label: 'Visual Sitemap Builder' },
];

const Navbar = () => {
    return (
        <nav className="bg-gray-800 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <Link href="/" className="text-2xl font-bold text-teal-400 hover:text-teal-300 transition duration-150">
                            Sitemap Tools Kit
                        </Link>
                    </div>
                    <div className="flex space-x-4">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.href}
                                href={link.href}
                                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition duration-150"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
