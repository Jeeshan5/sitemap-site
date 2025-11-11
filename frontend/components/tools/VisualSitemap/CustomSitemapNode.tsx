// frontend/components/tools/VisualSitemap/CustomSitemapNode.tsx
import React, { useCallback, useMemo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ExternalLink, Minus, Plus } from "lucide-react";

type MapMode = "default" | "dark" | "blueprint" | "bold";

const COLOR_PALETTES = {
  default: {
    root:     { bg: "linear-gradient(90deg,#38b2ac,#319795)", border: "#2c7a7b", text: "#ffffff" },
    normal:   { bg: "#bbf7d0", border: "#10b981", text: "#064e3b" }, 
    redirect: { bg: "#e5e7eb", border: "#6b7280", text: "#374151" }, 
    noindex:  { bg: "#fef9c3", border: "#eab308", text: "#92400e" }, 
    error:    { bg: "#fee2e2", border: "#dc2626", text: "#7f1d1d" },
  },
  dark: {
    root:     { bg: "#0f1724", border: "#24303b", text: "#e6eef7" },
    normal:   { bg: "#0f2f2b", border: "#10b981", text: "#d1fae5" },
    redirect: { bg: "#111827", border: "#6b7280", text: "#d1d5db" },
    noindex:  { bg: "#3b3006", border: "#eab308", text: "#fde68a" },
    error:    { bg: "#3f1d1d", border: "#ef4444", text: "#fecaca" },
  },
  blueprint: {
    root:     { bg: "#e8f1fb", border: "#93c5fd", text: "#0f1724" },
    normal:   { bg: "#f0f7ff", border: "#60a5fa", text: "#0b2540" },
    redirect: { bg: "#e5e7eb", border: "#64748b", text: "#334155" },
    noindex:  { bg: "#fef9c3", border: "#f59e0b", text: "#7c2d12" },
    error:    { bg: "#fee2e2", border: "#ef4444", text: "#7f1d1d" },
  },
  bold: {
    root:     { bg: "#4edb16ff", border: "#166534", text: "#073b1a" },
    normal:   { bg: "#dcfce7", border: "#16a34a", text: "#064e3b" },
    redirect: { bg: "#e5e7eb", border: "#6b7280", text: "#111827" },
    noindex:  { bg: "#fef9c3", border: "#d97706", text: "#7c2d12" },
    error:    { bg: "#fee2e2", border: "#b91c1c", text: "#7f1d1d" },
  },
} as const;

interface FlowNodeData {
  url?: string;
  title?: string;
  inboundLinks?: number;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  isRedirect?: boolean;
  isNoIndex?: boolean;
  status?: number;
  highlight?: boolean;
  onToggleCollapse?: (url: string) => void;
  level?: number;
  mapMode?: MapMode;
  width?: number | string;
}

const getNodeStyle = (data: FlowNodeData) => {
  const palette = COLOR_PALETTES[data.mapMode ?? "default"];
  const level = data.level ?? 0;

  let base;
  if (level === 0) base = palette.root;
  else base = palette.normal;

  if (data.status && data.status >= 400) base = palette.error;
  else if (data.isRedirect) base = palette.redirect;
  else if (data.isNoIndex) base = palette.noindex;

  return {
    headerColor: base.bg,
    borderColor: base.border,
    textColor: base.text,
    bodyColor: "#ffffff",
  };
};

const CustomSitemapNode: React.FC<NodeProps<FlowNodeData>> = ({ data }) => {
  const { headerColor, borderColor, textColor, bodyColor } = useMemo(
    () => getNodeStyle(data),
    [data]
  );

  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      data.onToggleCollapse?.(data.url!);
    },
    [data]
  );

  return (
    <>
      <div
        style={{
          width: data.width ?? 260,
          height: 70,
          borderRadius: 8,
          background: bodyColor,
          border: data.highlight ? `2px solid ${borderColor}` : `1px solid ${borderColor}`,
          boxShadow: data.highlight ? `0 0 14px ${borderColor}66` : "none",
          cursor: "pointer",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: headerColor,
            color: textColor,
            padding: "6px 10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 600,
            fontSize: "13px",
          }}
        >
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {data.title || data.url || "Untitled"}
          </span>

          <div style={{ display: "flex", gap: 6 }}>
            {data.hasChildren && (
              <button onClick={toggle} style={{ color: textColor }}>
                {data.isCollapsed ? <Plus size={14} /> : <Minus size={14} />}
              </button>
            )}
            {data.url && (
              <a href={data.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} style={{ color: textColor }} />
              </a>
            )}
          </div>
        </div>

        <div style={{ padding: "4px 10px", fontSize: "10px", color: "#475569" }}>
          <p className="truncate">{data.url}</p>
          {data.inboundLinks !== undefined && (
            <div className="mt-1 text-xs">Links: {data.inboundLinks}</div>
          )}
        </div>
      </div>

      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  );
};

export default CustomSitemapNode;
