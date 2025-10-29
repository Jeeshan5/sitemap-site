"use client";

import React from "react";
import { Download, FileText, FileSpreadsheet, FileCode, Image, FileJson } from "lucide-react";

type ExportPayload = { data: string; mime?: string } | null

const ExportModal = ({
  onClose,
  getExportPayload,
}: {
  onClose: () => void
  getExportPayload?: (format: string) => Promise<ExportPayload>
}) => {
  const exportOptions = [
    { label: "PNG", icon: <Image />, format: "png" },
    { label: "PDF", icon: <FileText />, format: "pdf" },
    { label: "TXT", icon: <FileText />, format: "txt" },
    { label: "CSV", icon: <FileSpreadsheet />, format: "csv" },
    { label: "XML", icon: <FileCode />, format: "xml" },
    { label: "Sitemap.xml", icon: <FileJson />, format: "sitemap" },
  ];

  const handleExport = async (format: string) => {
    try {
      const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      // ensure no trailing slash
      const apiBase = BASE_API.replace(/\/$/, '')
      if (getExportPayload) {
        const payload = await getExportPayload(format)
        if (!payload) throw new Error('No export payload available')

        const res = await fetch(`${apiBase}/export`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format, data: payload.data }),
        })

        if (!res.ok) {
          const errText = await res.text()
          throw new Error(`Export failed: ${res.status} ${errText}`)
        }

        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `crawler_export.${format}`
        link.click()
        window.URL.revokeObjectURL(url)
        return
      }

  // Fallback to legacy GET if no payload provider
  const res = await fetch(`${apiBase}/export/${format}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `crawler_export.${format}`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed: ' + (err instanceof Error ? err.message : String(err)))
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[500px] p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 hover:text-gray-800">
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4">Share</h2>
        <div className="flex border-b mb-4">
          <button className="px-4 py-2 text-gray-500 hover:text-black">Access</button>
          <button className="px-4 py-2 text-gray-500 hover:text-black">Embed</button>
          <button className="px-4 py-2 border-b-2 border-blue-500 text-blue-600 font-medium">Export</button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {exportOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleExport(opt.format)}
              className="border rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition"
            >
              <div className="text-blue-600">{opt.icon}</div>
              <span className="font-medium">{opt.label}</span>
              <span className="text-xs bg-green-100 text-green-700 rounded-full px-2">PRO</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
