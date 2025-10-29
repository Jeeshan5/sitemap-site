"use client";

import { useState, FC } from "react";
import {
  Download,
  Loader2,
  AlertTriangle,
  XCircle,
  Send,
  ArrowLeft,
  Maximize2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ExportModal from '../ExportModal'

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface ValidationIssue {
  error?: string;
  issues?: string[];
  warnings?: string[];
  isSafe?: boolean;
  message?: string;
  suggestion?: string;
}

const XmlSitemap: FC = () => {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState<ValidationIssue | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showExport, setShowExport] = useState(false);

  const generateXml = async () => {
    if (!url) {
      setError({ error: "Please enter a URL" });
      return;
    }

    setLoading(true);
    setError(null);
    setResult("");
    setWarnings([]);

    try {
      const response = await fetch(`${API_URL}/generate-xml`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data);
        return;
      }

      setResult(data.xml);
      if (data.warnings) {
        setWarnings(data.warnings);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError({ error: message || "Error generating XML sitemap" });
    } finally {
      setLoading(false);
    }
  };

  const downloadXml = () => {
    const blob = new Blob([result], { type: "application/xml" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "sitemap.xml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-gray-900 to-blue-950 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-blue-400 hover:text-blue-300 mb-6 font-semibold transition duration-200 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-blue-500/30 p-8 md:p-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              XML Sitemap Generator
            </h1>
          </div>

          <p className="text-gray-400 mb-8 ml-15">
            Generate valid sitemap.xml files for search engines — boost your
            SEO!
          </p>

          {/* Input & Generate */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Website URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full p-4 border-2 border-gray-700 rounded-xl bg-gray-900/50 text-white placeholder-gray-500 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all backdrop-blur-sm"
                onKeyPress={(e) => e.key === "Enter" && generateXml()}
              />
            </div>

            <button
              onClick={generateXml}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-xl 
                         hover:from-blue-700 hover:to-cyan-700 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 
                         font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  Crawling & Generating...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Generate XML Sitemap
                </>
              )}
            </button>
          </div>

          {/* Error / Warning Messages */}
          {error && error.issues && error.issues.length > 0 && (
            <div className="mt-8 p-6 bg-red-900/30 border-l-4 border-red-500 rounded-xl backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <XCircle className="text-red-400 flex-shrink-0 mt-0.5" size={24} />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-300 mb-2">
                    Security Issues Detected
                  </h3>
                  <p className="text-red-400 mb-2 text-sm">{error.message}</p>
                  <ul className="list-disc list-inside space-y-1 text-red-400 text-sm">
                    {error.issues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {error && !error.issues && (
            <div className="mt-8 p-6 bg-red-900/30 border border-red-700/50 rounded-xl backdrop-blur-sm">
              <p className="text-red-400 font-medium">
                {error.error || error.message}
              </p>
              {error.suggestion && (
                <p className="text-sm text-red-500 mt-2">
                  💡 {error.suggestion}
                </p>
              )}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="mt-8 p-6 bg-yellow-900/30 border-l-4 border-yellow-500 rounded-xl backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="text-yellow-400 flex-shrink-0 mt-0.5"
                  size={24}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-300 mb-2">
                    Warnings
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-yellow-400 text-sm">
                    {warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-xl font-bold text-blue-400">
                  Generated XML Sitemap
                </h2>

                {/* Download + Export buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadXml}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-xl 
                               hover:from-emerald-700 hover:to-green-700 transition-all font-medium shadow-lg shadow-emerald-500/30"
                  >
                    <Download size={18} />
                    Download XML
                  </button>

                  <button
                    onClick={() => setShowExport(true)}
                    disabled={!result}
                    className={`flex items-center gap-2 ${result ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : 'bg-gray-700 cursor-not-allowed'} text-white px-4 py-2 rounded-xl transition-all font-medium shadow-lg`}
                  >
                    <Maximize2 size={18} />
                    Export
                  </button>
                </div>
              </div>

              <div className="bg-gray-950 border-2 border-blue-500/20 p-6 rounded-xl overflow-x-auto max-h-96 shadow-inner">
                <pre className="text-cyan-400 text-sm whitespace-pre-wrap font-mono">
                  <code>{result}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          getExportPayload={async (format: string) => {
            if (!result) return null
            // Return the XML string; backend can wrap or convert as needed
            return { data: result }
          }}
        />
      )}
    </div>
  );
};

export default XmlSitemap;
