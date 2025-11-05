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
  Globe,
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

  // RESTORED ORIGINAL FUNCTIONALITY: Uses your backend API call
  const generateXml = async () => {
    if (!url) {
      setError({ error: "Please enter a valid URL" });
      return;
    }

    setLoading(true);
    setError(null);
    setResult("");
    setWarnings([]);

    try {
      // YOUR ORIGINAL API CALL LOGIC IS HERE:
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
    <div className="min-h-screen bg-[#0E1428] text-white p-4 sm:p-8 font-inter">
      <div className="max-w-4xl mx-auto">
        {/* Back button with subtle animation */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-indigo-400 hover:text-indigo-300 mb-8 font-medium transition duration-300 group hover:scale-[1.02]"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="bg-[#1C243B] rounded-3xl shadow-[0_0_50px_rgba(47,128,237,0.1)] border border-[#2F80ED]/30 p-8 md:p-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-[#2F80ED] to-[#00CED1] rounded-xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-[1.05] duration-300">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#00CED1] to-[#2F80ED] animate-gradient-shift">
              Sitemap Generator
            </h1>
          </div>

          <p className="text-gray-400 mt-4 mb-10 text-lg">
            Crawl your website to generate a search engine-friendly **XML sitemap**.
          </p>

          {/* Input & Generate */}
          <div className="space-y-6">
            <div>
              <label htmlFor="website-url" className="block text-sm font-semibold text-indigo-300 mb-2 transition-colors duration-300">
                Website URL (Start Crawling)
              </label>
              <input
                id="website-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                // FIX APPLIED: Using backticks (`...`) for multi-line string
                className={`w-full p-4 border-2 border-[#2F80ED]/50 rounded-xl bg-gray-900/40 text-white placeholder-gray-500 
                           focus:ring-4 focus:ring-[#00CED1]/30 focus:border-[#00CED1] transition-all duration-300 
                           shadow-inner shadow-black/20`}
                onKeyPress={(e) => e.key === "Enter" && generateXml()}
              />
            </div>

            <button
              onClick={generateXml}
              disabled={loading}
              className={`w-full text-white px-6 py-4 rounded-xl transition-all duration-300 font-bold flex items-center justify-center gap-3 
                        ${loading 
                          ? 'bg-gray-700 opacity-70 cursor-not-allowed shadow-none' 
                          : 'bg-gradient-to-r from-[#2F80ED] to-[#00CED1] hover:shadow-lg hover:shadow-[#00CED1]/40 hover:scale-[1.01] transform active:scale-[0.98] shadow-md shadow-[#2F80ED]/30'
                        }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  Crawling in Progress...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Generate XML Sitemap
                </>
              )}
            </button>
          </div>

          {/* Feedback Section (Errors/Warnings) */}
          
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

          {/* Result Display */}
          {result && (
            <div className="mt-10 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-[#1C243B] rounded-lg border-b border-[#2F80ED]/30">
                <h2 className="text-2xl font-extrabold text-[#00CED1]">
                  Generated Sitemap
                </h2>

                {/* Download + Export buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadXml}
                    className={`flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-xl 
                                  hover:from-emerald-700 hover:to-green-700 transition-all duration-300 font-medium shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-[1.05]`}
                  >
                    <Download size={18} />
                    Download XML
                  </button>

                  <button
                    onClick={() => setShowExport(true)}
                    disabled={!result}
                    className={`flex items-center gap-2 ${result ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/30 hover:shadow-lg hover:scale-[1.05]' : 'bg-gray-700 cursor-not-allowed'} text-white px-4 py-2 rounded-xl transition-all duration-300 font-medium`}
                  >
                    <Maximize2 size={18} />
                    Export Options
                  </button>
                </div>
              </div>

              <div className="bg-[#0D1223] border-2 border-[#00CED1]/20 p-6 rounded-xl overflow-x-auto max-h-[50vh] shadow-xl font-code relative">
                <pre className="text-cyan-400 text-sm whitespace-pre-wrap font-mono">
                  <code>{result}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Styles for animation utility (Needed for the modern UI) */}
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
          getExportPayload={async (format) => {
            if (!result) return null
            // Visual link: open /visual-builder?url=...
            if (format === 'visual') {
              if (url) {
                window.open(`/visual-builder?url=${encodeURIComponent(url)}`, '_blank');
                return null;
              }
            }
            return { data: result, mime: 'application/xml' }
          }}
        />
      )}
    </div>
  );
};

export default XmlSitemap;