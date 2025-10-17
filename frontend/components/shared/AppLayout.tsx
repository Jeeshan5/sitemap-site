import React from 'react';
import Navbar from './Navbar'; // Import the Navbar we just created

interface AppLayoutProps {
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <Navbar />
            <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                {children}
            </main>
            {/* You can add a Footer component here later if needed */}
        </div>
    );
};

export default AppLayout;
