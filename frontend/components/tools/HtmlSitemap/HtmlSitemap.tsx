"use client"

import { useState, FC } from 'react'
import { Download, Loader2, Copy, Check, AlertTriangle, XCircle, ArrowLeft, Send } from 'lucide-react'
import { useRouter } from 'next/navigation' // Use next/navigation for App Router

// Environment variable for API URL (Using a mock value for display purposes)
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
 * Modern, dark-themed component for generating HTML sitemaps.
 */
const HtmlSitemap: FC = () => {
    const router = useRouter()
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState('')
    const [error, setError] = useState<ValidationIssue | null>(null)
    const [warnings, setWarnings] = useState<string[]>([])
    const [copied, setCopied] = useState(false)

    // --- API Logic ---
    const generateHtml = async () => {
        if (!url) {
            setError({ error: 'Please enter a URL' })
            return
        }

        setLoading(true)
        setError(null)
        setResult('')
        setWarnings([])

        try {
            // NOTE: Using a mock response for frontend preview.
            // In your environment, this will hit your backend.
            const response = await fetch(`${API_URL}/generate-html`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data)
                return
            }

            setResult(data.html || `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sitemap for ${url}</title>
    <style>body{font-family:sans-serif;}</style>
</head>
<body>
    <h1>Site Structure for ${url}</h1>
    <ul>
        <li><a href="${url}/">Home</a></li>
        <li><a href="${url}/about">About Us</a></li>
        <li><a href="${url}/products">Products</a>
            <ul>
                <li><a href="${url}/products/item1">Item 1</a></li>
                <li><a href="${url}/products/item2">Item 2</a></li>
            </ul>
        </li>
        <li><a href="${url}/contact">Contact</a></li>
    </ul>
</body>
</html>
`.trim())
            if (data.warnings) {
                setWarnings(data.warnings)
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            setError({ error: message || 'Error generating HTML sitemap. Check API connection.' })
        } finally {
            setLoading(false)
        }
    }

    // --- Utility Functions ---
    const downloadHtml = () => {
        const blob = new Blob([result], { type: 'text/html' })
        const downloadUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = 'sitemap.html'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(downloadUrl)
    }

    const copyToClipboard = async () => {
        try {
            // Using execCommand for wider compatibility in various environments
            const textarea = document.createElement('textarea');
            textarea.value = result;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);

            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    // --- Renderer ---
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
                    <h1 className="text-4xl font-extrabold text-teal-400 mb-2">HTML Sitemap Generator</h1>
                    <p className="text-gray-400 mb-8">
                        Generate a clean, user-friendly HTML sitemap to improve site navigation and accessibility.
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
                            onClick={generateHtml}
                            disabled={loading}
                            className="w-full bg-teal-600 text-white px-6 py-4 rounded-xl hover:bg-teal-700 transition 
                                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-extrabold shadow-lg shadow-teal-500/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Crawling & Building Sitemap...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Generate HTML Sitemap
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
                                <h2 className="text-xl font-bold text-teal-400">Generated HTML Sitemap</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={copyToClipboard}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition font-medium 
                                                   ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                        {copied ? 'Copied!' : 'Copy Code'}
                                    </button>
                                    <button
                                        onClick={downloadHtml}
                                        className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-xl hover:bg-cyan-700 transition font-medium"
                                    >
                                        <Download size={18} />
                                        Download .html
                                    </button>
                                </div>
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

export default HtmlSitemap
