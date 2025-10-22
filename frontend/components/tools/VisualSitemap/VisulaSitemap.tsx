"use client"

import { useState, FC } from 'react'
import { Loader2, ZoomIn, ZoomOut, AlertTriangle, XCircle, Download, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation' // Import router for back button

// --- 1. Type Definitions ---
interface SitemapNode {
    url: string
    title?: string
    children?: SitemapNode[]
}

interface SitemapData {
    pages?: SitemapNode[]
}

interface ValidationIssue {
    error?: string
    issues?: string[]
    warnings?: string[]
    isSafe?: boolean
    message?: string
    suggestion?: string
}

// Environment variable for API URL (Using a mock value for display purposes)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// --- 2. Recursive Node Renderer Component ---
interface RenderNodeProps {
    node: SitemapNode;
    level: number;
    index: number;
}

const getNodeColor = (level: number) => {
    // Map colors to level for visual hierarchy
    const colors = [
        'bg-teal-600 border-teal-700',      // Level 0 (Root)
        'bg-cyan-600 border-cyan-700',      // Level 1
        'bg-blue-600 border-blue-700',      // Level 2
        'bg-indigo-600 border-indigo-700',  // Level 3
        'bg-purple-600 border-purple-700',  // Level 4+
    ]
    return colors[Math.min(level, colors.length - 1)] || colors[colors.length - 1]
}

const NodeRenderer: FC<RenderNodeProps> = ({ node, level, index }) => {
    const hasChildren = node.children && node.children.length > 0
    const nodeColorClass = getNodeColor(level);
    
    // Node URL shortener for display
    const shortUrl = node.url.replace(/https?:\/\/[^\/]+/, '');

    return (
        <div key={`${node.url}-${level}-${index}`} className="flex flex-col items-center relative">
            {/* Node Box */}
            <a 
                href={node.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${nodeColorClass} text-white rounded-xl px-4 py-2 shadow-lg transition-all duration-200 border-2 relative z-10 
                           hover:scale-105 hover:shadow-teal-400/50 cursor-pointer`}
                style={{ 
                    minWidth: '160px',
                    maxWidth: '200px'
                }}
            >
                <p className="font-bold text-center text-sm truncate">{node.title || 'Untitled Page'}</p>
                <p className="text-center text-xs opacity-75 truncate">{shortUrl || '/'}</p>
            </a>

            {/* Children Section */}
            {hasChildren && (
                <>
                    {/* Vertical line down from parent */}
                    <div className="w-0.5 h-8 bg-gray-600"></div>
                    
                    <div className="relative w-full">
                        {/* Horizontal line connecting children */}
                        {node.children!.length > 0 && (
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-600" style={{ transform: 'translateY(-10px)' }}></div>
                        )}
                        
                        {/* Children in a row */}
                        <div className="flex justify-center flex-wrap gap-12 pt-10">
                            {node.children!.map((child: SitemapNode, idx: number) => (
                                <div key={`child-${child.url}-${idx}`} className="flex flex-col items-center">
                                    {/* Vertical line up to horizontal bar */}
                                    <div className="w-0.5 h-10 bg-gray-600 -mt-10"></div>
                                    <NodeRenderer node={child} level={level + 1} index={idx} />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

// --- 3. Main Component ---
const VisualSitemap: FC = () => {
    const router = useRouter()
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [sitemapData, setSitemapData] = useState<SitemapData | null>(null)
    const [error, setError] = useState<ValidationIssue | null>(null)
    const [warnings, setWarnings] = useState<string[]>([])
    const [zoom, setZoom] = useState(100)

    const generateVisual = async () => {
        if (!url) {
            setError({ error: 'Please enter a URL' })
            return
        }

        setLoading(true)
        setError(null)
        setSitemapData(null)
        setWarnings([])

        try {
            // NOTE: Mock response for preview. You will hit your actual API here.
            const response = await fetch(`${API_URL}/generate-visual`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            })

            const data = await response.json()
            
            if (!response.ok || data.error) {
                setError(data)
                return
            }

            // Mock Data for successful generation
            const mockData: SitemapData = {
                pages: [
                    { url: `${url}/`, title: 'Home', children: [
                        { url: `${url}/products`, title: 'Products', children: [
                            { url: `${url}/products/item1`, title: 'Item 1' },
                            { url: `${url}/products/item2`, title: 'Item 2' }
                        ]},
                        { url: `${url}/services`, title: 'Services', children: [
                            { url: `${url}/services/basic`, title: 'Basic' },
                        ]},
                        { url: `${url}/about`, title: 'About Us' }
                    ]}
                ]
            };

            setSitemapData(mockData);
            if (data.warnings) {
                setWarnings(data.warnings)
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            setError({ error: message || 'Error generating visual sitemap. Check API connection.' })
        } finally {
            setLoading(false)
        }
    }

    const downloadAsImage = async () => {
        try {
            // Import html2canvas dynamically
            const html2canvas = (await import('html2canvas')).default
            
            // Get the sitemap container. Need to capture the element that is zoomed/transformed.
            const sitemapWrapper = document.querySelector('.sitemap-visual-wrapper') as HTMLElement
            const sitemapContainer = document.querySelector('.sitemap-container') as HTMLElement

            if (!sitemapContainer || !sitemapWrapper) {
                // Use a non-blocking UI message instead of alert()
                console.error('Sitemap elements not found. Please generate a sitemap first.')
                return 
            }
            
            // Temporarily set the container scale to 1 for a cleaner image capture
            const originalTransform = sitemapWrapper.style.transform;
            sitemapWrapper.style.transform = `scale(1)`;
            
            // Capture the element as canvas
            const canvas = await html2canvas(sitemapContainer, {
                backgroundColor: '#1F2937', // Dark background for contrast
                scale: 2, // Higher quality
                logging: false,
                useCORS: true,
                removeContainer: true, // Only capture the visual content
            })
            
            // Restore original scale after capture
            sitemapWrapper.style.transform = originalTransform;


            // Convert canvas to blob and trigger download
            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error('Failed to create image blob.')
                    return
                }
                
                const downloadUrl = URL.createObjectURL(blob)
                const link = document.createElement('a')
                const timestamp = new Date().toISOString().slice(0, 10)
                link.download = `visual-sitemap-${timestamp}.png`
                link.href = downloadUrl
                document.body.appendChild(link)
                link.click()
                
                // Cleanup
                document.body.removeChild(link)
                URL.revokeObjectURL(downloadUrl)
            }, 'image/png')
            
        } catch (error) {
            console.error('Download error:', error)
            // Use a console message instead of alert()
            console.error('Download failed. Ensure html2canvas is installed or try taking a screenshot manually.')
        }
    }

    // --- Renderer ---
    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center text-teal-400 hover:text-cyan-400 mb-6 font-semibold transition duration-200"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tools Dashboard
                </button>

                {/* Input Panel */}
                <div className="bg-gray-800 rounded-2xl shadow-2xl border border-teal-500/20 p-8 md:p-10 mb-6">
                    <h1 className="text-4xl font-extrabold text-teal-400 mb-2">Visual Sitemap Builder</h1>
                    <p className="text-gray-400 mb-8">
                        Map out site hierarchy visually for planning and collaboration.
                    </p>

                    <div className="space-y-6">
                        {/* Input Form */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Website URL (e.g., https://example.com)
                            </label>
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://yourwebsite.com"
                                className="w-full p-4 border border-gray-600 rounded-xl bg-gray-700 text-white placeholder-gray-500 
                                           focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
                            />
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={generateVisual}
                            disabled={loading}
                            className="w-full bg-teal-600 text-white px-6 py-4 rounded-xl hover:bg-teal-700 transition 
                                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-extrabold shadow-lg shadow-teal-500/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Crawling & Mapping Site...
                                </>
                            ) : (
                                <>
                                    Start Mapping
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Feedback Area */}
                {/* Security Errors */}
                {error && error.issues && error.issues.length > 0 && (
                    <div className="mt-6 p-6 bg-red-900/50 border-l-4 border-red-500 rounded-xl shadow-inner">
                        <div className="flex items-start gap-3">
                            <XCircle className="text-red-400 flex-shrink-0 mt-0.5" size={24} />
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-300 mb-2">Security Issues Detected</h3>
                                <p className="text-red-400 mb-2">{error.message || 'The target URL appears unsafe or blocked.'}</p>
                            </div>
                        </div>
                    </div>
                )}
                {/* General Errors */}
                {error && !error.issues && (
                    <div className="mt-6 p-6 bg-red-900/50 border border-red-700 rounded-xl">
                        <p className="text-red-400 font-medium">{error.error || error.message || 'An unknown error occurred.'}</p>
                    </div>
                )}
                {/* Warnings */}
                {warnings.length > 0 && (
                    <div className="mt-6 p-6 bg-yellow-900/50 border-l-4 border-yellow-500 rounded-xl shadow-inner">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={24} />
                            <div className="flex-1">
                                <h3 className="font-semibold text-yellow-300 mb-2">Crawl Warnings</h3>
                                <ul className="list-disc list-inside space-y-1 text-yellow-400 text-sm">
                                    {warnings.map((warning, idx) => (<li key={idx}>{warning}</li>))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Sitemap Visualization Area --- */}
                {sitemapData && (
                    <div className="bg-gray-800 rounded-2xl shadow-2xl border border-cyan-500/20 p-4 md:p-8 mt-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-teal-400">Site Structure Visualization</h2>
                            <div className="flex items-center gap-4">
                                
                                {/* Download Button */}
                                <button
                                    onClick={downloadAsImage}
                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition font-medium shadow-lg shadow-cyan-500/30"
                                    title="Download Sitemap as PNG"
                                >
                                    <Download size={18} />
                                    <span className="text-sm font-medium">Download PNG</span>
                                </button>

                                {/* Zoom Controls */}
                                <div className="flex items-center gap-2 bg-gray-700 rounded-xl p-1 border border-gray-600">
                                    <button
                                        onClick={() => setZoom(Math.max(50, zoom - 10))}
                                        className="p-1 bg-gray-600 rounded-lg hover:bg-gray-500 transition text-gray-200"
                                        title="Zoom Out"
                                    >
                                        <ZoomOut size={20} />
                                    </button>
                                    <span className="text-sm font-medium px-2 min-w-[50px] text-center text-teal-300">{zoom}%</span>
                                    <button
                                        onClick={() => setZoom(Math.min(150, zoom + 10))}
                                        className="p-1 bg-gray-600 rounded-lg hover:bg-gray-500 transition text-gray-200"
                                        title="Zoom In"
                                    >
                                        <ZoomIn size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Visualization Container */}
                        <div className="overflow-auto border border-gray-700 rounded-xl bg-gray-900" style={{ maxHeight: '75vh' }}>
                            <div className="sitemap-container inline-block min-w-full p-12">
                                <div
                                    className="sitemap-visual-wrapper inline-block min-w-full"
                                    style={{
                                        transform: `scale(${zoom / 100})`,
                                        transformOrigin: 'top center'
                                    }}
                                >
                                    {sitemapData.pages && sitemapData.pages.length > 0 ? (
                                        <div className="flex flex-col items-center gap-12">
                                            {sitemapData.pages.map((page: SitemapNode, idx: number) => (
                                                <div key={`root-${idx}`}>
                                                    <NodeRenderer node={page} level={0} index={idx} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 p-12">
                                            <p className="text-lg">No sitemap structure found for {url}</p>
                                            <p className="text-sm mt-2">Try a different URL or check your site's robots.txt.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default VisualSitemap
