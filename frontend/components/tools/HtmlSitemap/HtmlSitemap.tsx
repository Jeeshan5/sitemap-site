"use client";

import { useState, FC } from 'react'
import ExportModal from '../ExportModal'
import { Download, Loader2, Copy, Check, AlertTriangle, XCircle, ArrowLeft, Send, Maximize2, FileText, Code, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface ValidationIssue {
    error?: string
    issues?: string[]
    warnings?: string[]
    isSafe?: boolean
    message?: string
    suggestion?: string
}

interface SitemapStatistics {
    pages: number
    blogs: number
    images: number
    media: number
    other: number
}

const HtmlSitemap: FC = () => {
    const router = useRouter()
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState('')
    const [error, setError] = useState<ValidationIssue | null>(null)
    const [warnings, setWarnings] = useState<string[]>([])
    const [copied, setCopied] = useState(false)
    const [showExport, setShowExport] = useState(false)
    const [statistics, setStatistics] = useState<SitemapStatistics | null>(null)
    const [urlCount, setUrlCount] = useState<number>(0)

    const generateHtml = async () => {
        if (!url) {
            setError({ error: 'Please enter a URL' })
            return
        }

        setLoading(true)
        setError(null)
        setResult('')
        setWarnings([])
        setStatistics(null)
        setUrlCount(0)

        try {
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

            setResult(data.html)
            setUrlCount(data.urlCount || 0)
            
            if (data.warnings) {
                setWarnings(data.warnings)
            }
            
            // NEW: Set statistics from response
            if (data.statistics) {
                setStatistics(data.statistics)
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            setError({ error: message || 'Error generating HTML sitemap' })
        } finally {
            setLoading(false)
        }
    }

    const exportToXmlGenerator = () => {
        if (url) {
            router.push(`/xml-generator?url=${encodeURIComponent(url)}`);
        }
    }

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
            const textarea = document.createElement('textarea')
            textarea.value = result
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)

            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    return (
        <div className="min-h-screen bg-[#0E1428] text-white p-4 sm:p-8 font-inter">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center text-purple-400 hover:text-purple-300 mb-8 font-medium transition duration-300 group hover:scale-[1.02]"
                >
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> 
                    Back to Dashboard
                </button>

                <div className="bg-[#1C243B] rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.1)] border border-[#A855F7]/30 p-8 md:p-10">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#A855F7] to-[#EC4899] rounded-xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-[1.05] duration-300">
                            <FileText className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#EC4899] to-[#A855F7] animate-gradient-shift">
                            HTML Sitemap Generator
                        </h1>
                    </div>
                    
                    <p className="text-gray-400 mt-4 mb-10 text-lg">
                        Generate <strong>hierarchical HTML sitemaps</strong> organized by pages, blogs, images, and media for better navigation.
                    </p>

                    {/* Input & Generate */}
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="website-url" className="block text-sm font-semibold text-purple-300 mb-2 transition-colors duration-300">
                                Website URL
                            </label>
                            <input
                                id="website-url"
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com"
                                className={`w-full p-4 border-2 border-[#A855F7]/50 rounded-xl bg-gray-900/40 text-white placeholder-gray-500 
                                           focus:ring-4 focus:ring-[#EC4899]/30 focus:border-[#EC4899] transition-all duration-300 
                                           shadow-inner shadow-black/20`}
                                onKeyPress={(e) => e.key === 'Enter' && generateHtml()}
                            />
                        </div>

                        <button
                            onClick={generateHtml}
                            disabled={loading}
                            className={`w-full text-white px-6 py-4 rounded-xl transition-all duration-300 font-bold flex items-center justify-center gap-3 
                                        ${loading 
                                            ? 'bg-gray-700 opacity-70 cursor-not-allowed shadow-none' 
                                            : 'bg-gradient-to-r from-[#A855F7] to-[#EC4899] hover:shadow-lg hover:shadow-[#A855F7]/40 hover:scale-[1.01] transform active:scale-[0.98] shadow-md shadow-[#A855F7]/30'
                                        }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={22} />
                                    Building Hierarchical Sitemap...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Generate Hierarchical Sitemap
                                </>
                            )}
                        </button>
                    </div>

                    {/* Error Messages */}
                    {(error && error.issues && error.issues.length > 0) || (error && !error.issues) ? (
                        <div className="mt-8 p-6 bg-red-900/30 border border-red-700/50 rounded-xl backdrop-blur-sm animate-fade-in-down">
                            <div className="flex items-start gap-3">
                                <XCircle className="text-red-400 flex-shrink-0 mt-0.5" size={24} />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-red-300 mb-2">
                                        {error.issues ? "Security Issues Detected" : "Generation Error"}
                                    </h3>
                                    <p className="text-red-400 mb-2 text-sm">{error.error || error.message}</p>
                                    {error.issues && (
                                        <ul className="list-disc list-inside space-y-1 text-red-400 text-sm">
                                            {error.issues.map((issue, idx) => (<li key={idx}>{issue}</li>))}
                                        </ul>
                                    )}
                                    {error.suggestion && (
                                        <p className="text-sm text-red-500 mt-2">
                                            💡 {error.suggestion}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {warnings.length > 0 && (
                        <div className="mt-8 p-6 bg-yellow-900/30 border-l-4 border-yellow-500 rounded-xl backdrop-blur-sm animate-fade-in-down">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={24} />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-yellow-300 mb-2">Warnings</h3>
                                    <ul className="list-disc list-inside space-y-1 text-yellow-400 text-sm">
                                        {warnings.map((warning, idx) => (<li key={idx}>{warning}</li>))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NEW: Statistics Panel */}
                    {statistics && (
                        <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/50 rounded-xl backdrop-blur-sm animate-fade-in">
                            <div className="flex items-center gap-3 mb-4">
                                <BarChart3 className="text-purple-400" size={24} />
                                <h3 className="font-semibold text-purple-300 text-lg">Sitemap Statistics</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="bg-gray-900/50 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-white">{urlCount}</div>
                                    <div className="text-xs text-gray-400 mt-1">Total URLs</div>
                                </div>
                                <div className="bg-gray-900/50 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-blue-400">{statistics.pages}</div>
                                    <div className="text-xs text-gray-400 mt-1">Pages</div>
                                </div>
                                <div className="bg-gray-900/50 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-400">{statistics.blogs}</div>
                                    <div className="text-xs text-gray-400 mt-1">Blog Posts</div>
                                </div>
                                <div className="bg-gray-900/50 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-yellow-400">{statistics.images}</div>
                                    <div className="text-xs text-gray-400 mt-1">Images</div>
                                </div>
                                <div className="bg-gray-900/50 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-purple-400">{statistics.media}</div>
                                    <div className="text-xs text-gray-400 mt-1">Media Files</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Result Display */}
                    {result && (
                        <div className="mt-10 space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-[#1C243B] rounded-lg border-b border-[#A855F7]/30">
                                <h2 className="text-2xl font-extrabold text-purple-400">
                                    Generated Hierarchical HTML
                                </h2>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={copyToClipboard}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium shadow-lg hover:scale-[1.05]
                                                    ${copied 
                                                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-500/30' 
                                                        : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 shadow-gray-500/30'}`}
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                        {copied ? 'Copied!' : 'Copy Code'}
                                    </button>

                                    <button
                                        onClick={exportToXmlGenerator}
                                        className={`flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-2 rounded-xl 
                                                    hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-md shadow-cyan-500/30 hover:shadow-lg hover:scale-[1.05]`}
                                    >
                                        <Code size={18} />
                                        Export to XML
                                    </button>

                                    <button
                                        onClick={() => setShowExport(true)}
                                        disabled={!result}
                                        className={`flex items-center gap-2 ${result ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-violet-500/30 hover:shadow-lg hover:scale-[1.05]' : 'bg-gray-700 cursor-not-allowed'} text-white px-4 py-2 rounded-xl transition-all duration-300 font-medium`}
                                    >
                                        <Maximize2 size={18} />
                                        Export Options
                                    </button>
                                </div>
                            </div>

                            <div className="bg-[#0D1223] border-2 border-[#EC4899]/20 p-6 rounded-xl overflow-x-auto max-h-[50vh] shadow-xl font-code relative">
                                <pre className="text-green-400 text-sm whitespace-pre-wrap font-mono">
                                    <code>{result}</code>
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <style jsx global>{`
                @keyframes gradient-shift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient-shift {
                    background-size: 200% auto;
                    animation: gradient-shift 5s ease-in-out infinite;
                }
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down {
                    animation: fadeInDown 0.5s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fadeIn 0.6s ease-out forwards;
                }
            `}</style>

            {showExport && (
                <ExportModal
                    onClose={() => setShowExport(false)}
                    initialUrl={url}
                    excludeFormats={['html']}
                    getExportPayload={async (format) => {
                        if (!result) return null
                        return { data: result, mime: 'text/html' }
                    }}
                />
            )}
        </div>
    );
}

export default HtmlSitemap