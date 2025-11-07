"use client";

import React from "react";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  LayoutDashboard,
  Code,
  X
} from "lucide-react";

type ExportPayload = { data: string; mime?: string } | null;
type PageType = "xml" | "html" | "visual";

const ExportModal = ({
  onClose,
  getExportPayload,
  initialUrl,
  currentPage,
  excludeFormats = [],
}: {
  onClose: () => void;
  getExportPayload?: (format: string) => Promise<ExportPayload>;
  initialUrl?: string;
  currentPage?: PageType;
  excludeFormats?: string[];
}) => {

  const baseExportOptions = [
    { label: "PNG", icon: <ImageIcon size={24} />, format: "png", type: "export" },
    { label: "PDF", icon: <FileText size={24} />, format: "pdf", type: "export" },
    { label: "TXT", icon: <FileText size={24} />, format: "txt", type: "export" },
    { label: "SVG", icon: <Code size={24} />, format: "svg", type: "export" },

    { label: "HTML", icon: <FileSpreadsheet size={24} />, format: "html", type: "page", route: "/html-generator" },
    { label: "XML", icon: <FileCode size={24} />, format: "xml", type: "page", route: "/xml-generator" },
    { label: "Visual", icon: <LayoutDashboard size={24} />, format: "visual", type: "page", route: "/visual-builder" },
  ];

  // Remove XML button if on XML page, always show 6 buttons
  const exportOptions = baseExportOptions.filter(opt => {
    if (currentPage === 'xml' && opt.format === 'xml') return false;
    if (excludeFormats.includes(opt.format)) return false;
    // Hide the tool link that points back to the current page
    if (opt.type === 'page' && opt.format === currentPage) return false;
    return true;
  });

  const getFilename = (ext: string) => {
    try {
      const domain = new URL(initialUrl || "").hostname.replace(/^www\./, "");
      return `${domain.split(".")[0]}-sitemap.${ext}`;
    } catch {
      return `sitemap.${ext}`;
    }
  };

  const downloadRaw = async (data: string, mime: string, ext: string) => {
    const blob = data.startsWith("data:")
      ? await (await fetch(data)).blob()
      : new Blob([data], { type: mime });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getFilename(ext);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: string, route?: string) => {
    if (route && initialUrl) {
      window.open(`${route}?url=${encodeURIComponent(initialUrl)}`, "_blank");
      return;
    }

    if (!getExportPayload) return;
    const payload = await getExportPayload(format);
    if (!payload || !payload.data) return;

    const { data, mime } = payload;

    if (format === "txt") return downloadRaw(data, "text/plain", "txt");
    if (format === "svg") return downloadRaw(data, "image/svg+xml", "svg");
    if (format === "png") return downloadRaw(data, mime || "image/png", "png");

    const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
    const res = await fetch(`${API}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format, data }),
    });

    const blob = await res.blob();
    downloadRaw(await blob.text(), "application/pdf", "pdf");
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
      <div className="bg-white dark:bg-[#1c2436] w-[520px] rounded-2xl shadow-2xl border border-white/20 relative p-7 animate-popIn">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 transition"
        >
          <X size={22} />
        </button>

        {/* Header */}
        <h2 className="text-xl font-semibold text-center text-gray-800 dark:text-white mb-2">
          Share & Export
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">
          Export your sitemap or open it in other tools.
        </p>

        {/* Tabs */}
        <div className="flex justify-center mb-6 border-b pb-2 border-gray-200/40 dark:border-gray-700/50">
          <button className="px-4 py-1 text-gray-500 hover:text-black dark:hover:text-white transition">
            Access
          </button>
          <button className="px-4 py-1 text-gray-500 hover:text-black dark:hover:text-white transition">
            Embed
          </button>
          <button className="px-4 py-1 border-b-2 border-blue-500 text-blue-600 font-medium">
            Export
          </button>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-3 gap-4">
          {exportOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleExport(opt.format, opt.route)}
              className="group p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/40 bg-white/70 dark:bg-white/10 shadow-sm hover:shadow-xl hover:scale-[1.04] transition-all text-center"
            >
              <div className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                {opt.icon}
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-200 block mt-2 text-sm">
                {opt.label}
              </span>
            </button>
          ))}
        </div>

      </div>

      <style jsx global>{`
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-popIn {
          animation: popIn 0.25s ease-out forwards;
        }
        @keyframes fadeIn { from {opacity: 0;} to {opacity: 1;} }
        @keyframes popIn { from {opacity: 0; transform: scale(.95);} to {opacity: 1; transform: scale(1);} }
      `}</style>
    </div>
  );
};

export default ExportModal;
