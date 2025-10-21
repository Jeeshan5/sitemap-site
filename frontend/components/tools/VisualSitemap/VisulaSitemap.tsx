'use client'

import { useState } from 'react'
import { Loader2, ZoomIn, ZoomOut, AlertTriangle, XCircle } from 'lucide-react'

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

export default function VisualSitemap() {
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
      const response = await fetch('http://localhost:5000/api/generate-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data)
        return
      }

      setSitemapData(data)
      if (data.warnings) {
        setWarnings(data.warnings)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError({ error: message || 'Error generating visual sitemap' })
    } finally {
      setLoading(false)
    }
  }

  // Color palette for different levels
  const getNodeColor = (level: number, index: number) => {
    const colors = [
      'bg-emerald-500 text-white border-emerald-600', // Homepage
      'bg-blue-500 text-white border-blue-600',
      'bg-red-500 text-white border-red-600',
      'bg-purple-500 text-white border-purple-600',
      'bg-orange-500 text-white border-orange-600',
      'bg-teal-500 text-white border-teal-600',
      'bg-yellow-500 text-white border-yellow-600',
      'bg-pink-500 text-white border-pink-600',
      'bg-indigo-500 text-white border-indigo-600'
    ]
    
    if (level === 0) return colors[0]
    return colors[(index % (colors.length - 1)) + 1]
  }

  const renderNode = (node: SitemapNode, level: number = 0, index: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    
    return (
      <div key={node.url} className="flex flex-col items-center relative">
        {/* Vertical connector line to parent */}
        {level > 0 && (
          <div className="w-0.5 h-8 bg-gray-400 mb-2"></div>
        )}
        
        {/* Node box */}
        <div
          className={`${getNodeColor(level, index)} rounded-lg px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer border-2 relative z-10`}
          style={{ 
            minWidth: level === 0 ? '200px' : '180px',
            maxWidth: '250px'
          }}
        >
          <p className="font-semibold text-center truncate text-sm">
            {node.title || 'Untitled'}
          </p>
          {level === 0 && (
            <p className="text-xs text-center opacity-90 truncate mt-1">{node.url}</p>
          )}
        </div>

        {/* Children container */}
        {hasChildren && (
          <>
            {/* Vertical line from parent to children row */}
            <div className="w-0.5 h-8 bg-gray-400 mt-2"></div>
            
            {/* Horizontal connector line */}
            {node.children!.length > 1 && (
              <div 
                className="h-0.5 bg-gray-400 absolute"
                style={{
                  width: `${(node.children!.length - 1) * 220}px`,
                  top: level === 0 ? '120px' : '100px',
                  left: '50%',
                  transform: 'translateX(-50%)'
                }}
              ></div>
            )}
            
            {/* Children nodes in a horizontal row */}
            <div className="flex justify-center items-start gap-8 mt-2">
              {node.children!.map((child: SitemapNode, idx: number) => (
                <div key={child.url} className="relative">
                  {renderNode(child, level + 1, idx)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Visual Sitemap Builder</h1>
          <p className="text-gray-600 mb-8">
            Map out site hierarchy visually for planning and collaboration.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800 placeholder-gray-400"
              />
            </div>

            <button
              onClick={generateVisual}
              disabled={loading}
              className="w-full bg-teal-600 text-white px-6 py-4 rounded-lg hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Validating and Mapping...
                </>
              ) : (
                'Start Mapping'
              )}
            </button>
          </div>

          {error && error.issues && error.issues.length > 0 && (
            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-start gap-3">
                <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-2">Security Issues Detected</h3>
                  <p className="text-red-700 mb-2">{error.message}</p>
                  <ul className="list-disc list-inside space-y-1">
                    {error.issues.map((issue, idx) => (
                      <li key={idx} className="text-red-700">{issue}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-red-600 mt-3">
                    ℹ️ We cannot crawl this website to protect your security.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && !error.issues && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error.error || error.message}</p>
              {error.suggestion && (
                <p className="text-sm text-red-600 mt-2">💡 {error.suggestion}</p>
              )}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={24} />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800 mb-2">Warnings</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {warnings.map((warning, idx) => (
                      <li key={idx} className="text-yellow-700">{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {sitemapData && (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Site Structure</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  <ZoomOut size={20} />
                </button>
                <span className="text-sm font-medium px-3">{zoom}%</span>
                <button
                  onClick={() => setZoom(Math.min(150, zoom + 10))}
                  className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  <ZoomIn size={20} />
                </button>
              </div>
            </div>

            <div
              className="overflow-auto border border-gray-200 rounded-lg p-12 bg-gray-50"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                minHeight: '500px'
              }}
            >
              {sitemapData.pages ? (
                <div className="flex flex-col items-center gap-0">
                  {sitemapData.pages.map((page: SitemapNode, idx: number) => renderNode(page, 0, idx))}
                </div>
              ) : (
                <div className="text-center text-gray-500 p-12">
                  <p className="text-lg">Visual sitemap structure will appear here</p>
                  <p className="text-sm mt-2">Crawling {url}...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}