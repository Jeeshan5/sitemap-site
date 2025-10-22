"use client"

import { useState, FC } from 'react'
import { Download, Loader2, AlertTriangle, XCircle, Send, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation' // Import router for back button

// Environment variable for API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface ValidationIssue {
    error?: string
    issues?: string[]
    warnings?: string[]
    isSafe?: boolean
    message?: string
    suggestion?: string
}

/**
 * Modern, dark-themed component for generating XML sitemaps.
 */
const XmlSitemap: FC = () => {
    const router = useRouter()
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState('')
    const [error, setError] = useState<ValidationIssue | null>(null)
    const [warnings, setWarnings] = useState<string[]>([])

    const generateXml = async () => {
        if (!url) {
            setError({ error: 'Please enter a URL' })
            return
        }

        setLoading(true)
        setError(null)
        setResult('')
        setWarnings([])

        try {
            // NOTE: Using a mock response structure for frontend preview.
            const response = await fetch(`${API_URL}/generate-xml`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data)
                return
            }

            // Mock XML response for demonstration
            const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${url}/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${url}/products</loc>
        <lastmod>2024-10-22</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${url}/about</loc>
        <lastmod>2024-01-15</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
</urlset>`.trim();

            setResult(data.xml || mockXml)
            if (data.warnings) {
                setWarnings(data.warnings)
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            setError({ error: message || 'Error generating XML sitemap. Check API connection.' })
        } finally {
            setLoading(false)
        }
    }

    const downloadXml = () => {
        const blob = new Blob([result], { type: 'application/xml' })
        const downloadUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = 'sitemap.xml'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(downloadUrl)
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                 {/* Back Button */}
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center text-teal-400 hover:text-cyan-400 mb-6 font-semibold transition duration-200"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tools Dashboard
                </button>

                <div className="bg-gray-800 rounded-2xl shadow-2xl border border-teal-500/20 p-8 md:p-10">
                    <h1 className="text-4xl font-extrabold text-teal-400 mb-2">XML Sitemap Generator</h1>
                    <p className="text-gray-400 mb-8">
                        Crawl your site and generate a valid `sitemap.xml` file for search engines.
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
                            onClick={generateXml}
                            disabled={loading}
                            className="w-full bg-teal-600 text-white px-6 py-4 rounded-xl hover:bg-teal-700 transition 
                                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-extrabold shadow-lg shadow-teal-500/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Validating and Crawling...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Generate XML Sitemap
                                </>
                            )}
                        </button>
                    </div>

                    {/* --- Feedback & Results Area --- */}
                    
                    {/* Security Errors */}
                    {error && error.issues && error.issues.length > 0 && (
                        <div className="mt-8 p-6 bg-red-900/50 border-l-4 border-red-500 rounded-xl shadow-inner">
                            <div className="flex items-start gap-3">
                                <XCircle className="text-red-400 flex-shrink-0 mt-0.5" size={24} />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-red-300 mb-2">Security Issues Detected</h3>
                                    <p className="text-red-400 mb-2">{error.message || 'The target URL appears unsafe or blocked.'}</p>
                                    <ul className="list-disc list-inside space-y-1 text-red-400 text-sm">
                                        {error.issues.map((issue, idx) => (<li key={idx}>{issue}</li>))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* General Errors */}
                    {error && !error.issues && (
                        <div className="mt-8 p-6 bg-red-900/50 border border-red-700 rounded-xl">
                            <p className="text-red-400 font-medium">{error.error || error.message || 'An unknown error occurred.'}</p>
                            {error.suggestion && (
                                <p className="text-sm text-red-500 mt-2">💡 Suggestion: {error.suggestion}</p>
                            )}
                        </div>
                    )}

                    {/* Warnings */}
                    {warnings.length > 0 && (
                        <div className="mt-8 p-6 bg-yellow-900/50 border-l-4 border-yellow-500 rounded-xl shadow-inner">
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

                    {/* Results Output */}
                    {result && (
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-teal-400">Generated XML Sitemap</h2>
                                <button
                                    onClick={downloadXml}
                                    className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-xl hover:bg-cyan-700 transition font-medium shadow-lg shadow-cyan-500/30"
                                >
                                    <Download size={18} />
                                    Download .xml
                                </button>
                            </div>
                            <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl overflow-x-auto max-h-96 shadow-lg">
                                <pre className="text-teal-400 text-sm whitespace-pre-wrap">
                                    <code>{result}</code>
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default XmlSitemap
