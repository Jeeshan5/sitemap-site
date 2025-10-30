"use client";

import React from "react";
import { FileText, FileSpreadsheet, FileCode, Image as ImageIcon } from "lucide-react";

type ExportPayload = { data: string; mime?: string } | null

const ExportModal = ({
  onClose,
  getExportPayload,
  initialUrl,
}: {
  onClose: () => void
  getExportPayload?: (format: string) => Promise<ExportPayload>
  initialUrl?: string
}) => {
  const exportOptions = [
  { label: "PNG", icon: <ImageIcon aria-hidden="true" />, format: "png" },
    { label: "PDF", icon: <FileText aria-hidden="true" />, format: "pdf" },
    { label: "TXT", icon: <FileText aria-hidden="true" />, format: "txt" },
    { label: "HTML", icon: <FileSpreadsheet aria-hidden="true" />, format: "html" },
    { label: "XML", icon: <FileCode aria-hidden="true" />, format: "xml" },
    // Replace the old Sitemap.xml button with a client-side SVG export option
    { label: "SVG", icon: <FileCode aria-hidden="true" />, format: "svg" },
  ];

  const handleExport = async (format: string) => {
    try {
      const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      // ensure no trailing slash
      const apiBase = BASE_API.replace(/\/$/, '')
      // If user wants the sitemap/html generators, open those pages with the provided URL (if available)
      if ((format === 'xml') && initialUrl) {
        const href = `/xml-generator?url=${encodeURIComponent(initialUrl)}`
        window.open(href, '_blank')
        return
      }
      if (format === 'html' && initialUrl) {
        const href = `/html-generator?url=${encodeURIComponent(initialUrl)}`
        window.open(href, '_blank')
        return
      }

      // If the caller provides a payload provider, prefer client-side handling for text/html/xml/svg
      if (getExportPayload) {
        let payload = await getExportPayload(format)

        // If no payload for requested format, try reasonable fallbacks (PDF from SVG, PNG from SVG)
        if (!payload) {
          if (format === 'pdf') {
            payload = (await getExportPayload('svg')) || (await getExportPayload('png'))
          } else if (['png', 'jpg', 'jpeg', 'photo'].includes(format)) {
            payload = (await getExportPayload('png')) || (await getExportPayload('svg'))
          }
        }

        const data = payload && payload.data ? payload.data : null

  // Helper: download raw data as a file
  const downloadRaw = async (content: string | ArrayBuffer | Uint8Array | null, mime: string, ext: string, isBase64 = false): Promise<void> => {
          // If content is a data URL, use fetch() to convert to a Blob reliably (handles base64 and utf8 cases)
          if (typeof content === 'string' && content.startsWith('data:')) {
            try {
              const res = await fetch(content)
              const blob = await res.blob()
              const objectUrl = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = objectUrl
              a.download = `crawler_export.${ext}`
              document.body.appendChild(a)
              a.click()
              a.remove()
              URL.revokeObjectURL(objectUrl)
              return
            } catch (e) {
              // fallback to manual handling below if fetch() fails
              console.warn('fetch(dataUrl) failed, falling back to manual decode', e)
            }
          }

          let blob: Blob
          if (isBase64 && typeof content === 'string') {
            // content is a base64 string without data: prefix
            try {
              const byteChars = atob(content)
              const byteNumbers = new Array(byteChars.length)
              for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i)
              const byteArray = new Uint8Array(byteNumbers)
              blob = new Blob([byteArray.buffer as ArrayBuffer], { type: mime })
            } catch {
              // If atob fails, attempt to decode as URI component
              const text = decodeURIComponent(content)
              blob = new Blob([text], { type: mime })
            }
          } else if (typeof content === 'string') {
            blob = new Blob([content], { type: mime })
          } else {
            // content may already be an ArrayBuffer or Uint8Array
            if (content instanceof Uint8Array) {
              blob = new Blob([content.buffer as ArrayBuffer], { type: mime })
            } else if (content instanceof ArrayBuffer) {
              blob = new Blob([content], { type: mime })
            } else {
              blob = new Blob([], { type: mime })
            }
          }

          const objectUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = objectUrl
          a.download = `crawler_export.${ext}`
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(objectUrl)
        }

        // TXT: download as plain text
        if (format === 'txt') {
          if (data) {
            await downloadRaw(data, 'text/plain;charset=utf-8', 'txt')
            return
          }
        }

        // XML: if we have raw XML, download directly
        if (format === 'xml') {
          // If payload looks like a data URL with base64, decode; else save raw
          if (data && typeof data === 'string' && data.startsWith('data:')) {
            await downloadRaw(data, 'application/xml;charset=utf-8', 'xml', true)
            return
          }
          if (data) {
            await downloadRaw(data, 'application/xml;charset=utf-8', 'xml')
            return
          }
        }

        // HTML: save raw html
        if (format === 'html') {
          if (data && typeof data === 'string' && data.startsWith('data:')) {
            await downloadRaw(data, 'text/html;charset=utf-8', 'html', true)
            return
          }
          if (data) {
            await downloadRaw(data, 'text/html;charset=utf-8', 'html')
            return
          }
        }

        // SVG: handle raw svg markup or data URL
        if (format === 'svg') {
          if (data && typeof data === 'string' && data.startsWith('data:')) {
            // data URL -> decode and download
            const isSvg = data.startsWith('data:image/svg+xml')
            if (isSvg) {
              await downloadRaw(data, 'image/svg+xml', 'svg', true)
              return
            }
            // other image data -> attempt to download the data URL
            await downloadRaw(data, 'image/svg+xml', 'svg', true)
            return
          }
          // raw svg markup
          if (data && typeof data === 'string' && data.trim().startsWith('<svg')) {
            await downloadRaw(data, 'image/svg+xml;charset=utf-8', 'svg')
            return
          }
        }

        // For raster images and pdf, fall back to server POST so server can convert/persist
        if (['png', 'pdf', 'jpg', 'jpeg', 'photo'].includes(format)) {
          const res = await fetch(`${apiBase}/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ format, data }),
          })

          if (!res.ok) {
            const errText = await res.text()
            throw new Error(`Export failed: ${res.status} ${errText}`)
          }

          const blob = await res.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `crawler_export.${format === 'photo' ? 'png' : format}`
          link.click()
          window.URL.revokeObjectURL(url)
          return
        }

        // Unknown/unsupported by client side: attempt to POST to server
        const fallbackRes = await fetch(`${apiBase}/export`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format, data }),
        })

        if (!fallbackRes.ok) {
          const errText = await fallbackRes.text()
          throw new Error(`Export failed: ${fallbackRes.status} ${errText}`)
        }

        const fallbackBlob = await fallbackRes.blob()
        const fallbackUrl = window.URL.createObjectURL(fallbackBlob)
        const fallbackLink = document.createElement('a')
        fallbackLink.href = fallbackUrl
        fallbackLink.download = `crawler_export.${format}`
        fallbackLink.click()
        window.URL.revokeObjectURL(fallbackUrl)
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
