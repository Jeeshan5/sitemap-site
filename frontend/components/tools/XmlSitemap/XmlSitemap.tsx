'use client'

import { useState } from 'react'
import { Download, Loader2, AlertTriangle, XCircle } from 'lucide-react'

interface ValidationIssue {
  error?: string
  issues?: string[]
  warnings?: string[]
  isSafe?: boolean
  message?: string
  suggestion?: string
}

export default function XmlSitemap() {
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
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

    try {
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

      setResult(data.xml)
      if (data.warnings) {
        setWarnings(data.warnings)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError({ error: message || 'Error generating XML sitemap' })
    } finally {
      setLoading(false)
    }
  }

  const downloadXml = () => {
    const blob = new Blob([result], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sitemap.xml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">XML Sitemap Generator</h1>
          <p className="text-gray-600 mb-8">
            Crawl your site and generate a valid sitemap.xml file for search engines.
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
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
              />
            </div>

            <button
              onClick={generateXml}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Validating and Crawling...
                </>
              ) : (
                'Generate XML Sitemap'
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

          {result && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Generated XML</h2>
                <button
                  onClick={downloadXml}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <Download size={18} />
                  Download
                </button>
              </div>
              <div className="bg-gray-900 p-6 rounded-lg overflow-x-auto">
                <pre className="text-green-400 text-sm">
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