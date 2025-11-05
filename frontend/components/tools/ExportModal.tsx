"use client";

import React from "react";
import { FileText, FileSpreadsheet, FileCode, Image as ImageIcon, LayoutDashboard, Code } from "lucide-react"; 

type ExportPayload = { data: string; mime?: string } | null
type PageType = 'xml' | 'html' | 'visual';

const ExportModal = ({
  onClose,
  getExportPayload,
  initialUrl,
  currentPage, 
  excludeFormats = [], 
}: {
  onClose: () => void
  getExportPayload?: (format: string) => Promise<ExportPayload>
  initialUrl?: string
  currentPage?: PageType
  excludeFormats?: string[]
}) => {
  
  // Define all 7 export/tool options
  const baseExportOptions = [
    // Standard Exports
    { label: "PNG", icon: <ImageIcon aria-hidden="true" />, format: "png", type: 'export' },
    { label: "PDF", icon: <FileText aria-hidden="true" />, format: "pdf", type: 'export' },
    { label: "TXT", icon: <FileText aria-hidden="true" />, format: "txt", type: 'export' },
    { label: "SVG", icon: <Code aria-hidden="true" />, format: "svg", type: 'export' }, 

    // Tool Links (Contextual Options) - MUST use the final URL routes
    { label: "HTML", icon: <FileSpreadsheet aria-hidden="true" />, format: "html", type: 'tool', targetRoute: '/html-generator' }, 
    { label: "XML", icon: <FileCode aria-hidden="true" />, format: "xml", type: 'tool', targetRoute: '/xml-generator' },
    { label: "Visual", icon: <LayoutDashboard aria-hidden="true" />, format: "visual", type: 'tool', targetRoute: '/visual-builder' }, 
  ];

  // Logic to filter the list:
  const exportOptions = baseExportOptions.filter(opt => {
    if (excludeFormats.includes(opt.format)) return false;
    
    // Hide the tool link that points back to the current page (Contextual Fix)
    if (opt.type === 'tool' && opt.format === currentPage) {
        return false;
    }
    
    return true;
  });

  // --- NEW FILENAME HELPER (Generates descriptive name) ---
  const getFilenameFromUrl = (url: string, extension: string): string => {
    try {
        if (!url || url === 'placeholder.com') return `sitemap_export_${Date.now()}.${extension}`;
        
        const parsedUrl = new URL(url);
        const domain = parsedUrl.hostname.replace(/^www\./, '');
        // Format: domain-sitemap-timestamp.ext (e.g., youtube-sitemap-20251106.xml)
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `${domain.split('.')[0]}-sitemap-${timestamp}.${extension}`;
    } catch {
        return `sitemap_export_${Date.now()}.${extension}`;
    }
  };
  // --- END NEW FILENAME HELPER ---

  // --- CRITICAL DOWNLOAD HELPER FUNCTION (Uses new filename helper) ---
  const downloadRaw = async (content: string | ArrayBuffer | ArrayBufferView | null, mime: string, ext: string, isBase64 = false): Promise<void> => {
  if (!content) return;
  let blob: Blob;
  if (typeof content === 'string' && content.startsWith('data:')) {
    try {
      // Use fetch to reliably convert data URL (base64 or encoded) to a Blob
      const res = await fetch(content);
      blob = await res.blob();
    } catch (e) {
      console.error("Failed to fetch data URL during download:", e);
      return; 
    }
  } else if (typeof content === 'string') {
    // plain string content
    blob = new Blob([content], { type: mime });
  } else if (content instanceof ArrayBuffer) {
    // direct ArrayBuffer
    blob = new Blob([content], { type: mime });
  } else {
    // content is an ArrayBufferView (e.g., Uint8Array). Normalize to a Uint8Array slice to ensure Blob accepts it.
    const view = content as ArrayBufferView;
    // Create a Uint8Array over the view's buffer and slice the exact byte range to get a standalone copy
    // (this avoids issues with SharedArrayBuffer vs ArrayBuffer typings and produces a Blob-compatible part)
    const uint8 = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    const uint8Copy = uint8.slice();
    blob = new Blob([uint8Copy], { type: mime });
  }
  const filename = getFilenameFromUrl(initialUrl || 'placeholder.com', ext); 
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename; // Set the new descriptive filename
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
  };
  // --- END OF CRITICAL DOWNLOAD HELPER FUNCTION ---


  const handleExport = async (format: string, targetRoute?: string) => {
    try {
      const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const apiBase = BASE_API.replace(/\/$/, '')
      
      // REDIRECT LOGIC FOR TOOL BUTTONS (HTML, XML, Visual)
      if (targetRoute && initialUrl) {
        const href = `${targetRoute}?url=${encodeURIComponent(initialUrl)}`
        window.open(href, '_blank')
        return;
      }
      
      // --- CLIENT-SIDE DOWNLOADS ---
      
      if (getExportPayload) {
  const payload = await getExportPayload(format)
        
        if (!payload || !payload.data) {
          if (['png', 'svg', 'pdf'].includes(format)) return;
          console.error(`Export failed: No payload data available for ${format}.`);
          return;
        }
        
        const { data, mime } = payload;

        // 1. Handle standard text/code downloads 
        if (format === 'txt') { return downloadRaw(data, 'text/plain;charset=utf-8', 'txt'); }
        if (format === 'xml') { return downloadRaw(data, 'application/xml;charset=utf-8', 'xml'); }
        if (format === 'html') { return downloadRaw(data, 'text/html;charset=utf-8', 'html'); }
        if (format === 'svg') { return downloadRaw(data, 'image/svg+xml;charset=utf-8', 'svg'); }
        
        // 2. Fallback to server POST for formats needing conversion (like PDF)
        const res = await fetch(`${apiBase}/export`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ format, data, mime }),
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Server export failed: ${res.status} ${errText}`);
        }

        const blob = await res.blob();
        const ext = format === 'photo' ? 'png' : format; // Determine extension
        const filename = getFilenameFromUrl(initialUrl || 'placeholder.com', ext);
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename; // Set the new descriptive filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

    } catch (err) {
      console.error('Export failed:', err)
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
              // Pass targetRoute to handleExport if it's a tool button
              onClick={() => handleExport(opt.format, opt.targetRoute)}
              className="border rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-lg transition text-gray-800 hover:scale-[1.03] duration-200"
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