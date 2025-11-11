// frontend/components/tools/VisualSitemap/CustomSitemapNode.tsx
import React, { useCallback, useMemo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ExternalLink, Minus, Plus } from "lucide-react";

type MapMode = "default" | "dark" | "blueprint" | "bold";

// 🎨 LEVEL-BASED COLOR PALETTES
const COLOR_PALETTES: Record<MapMode, { bg: string; border: string; text: string }[]> = {
  default: [
    { bg: "linear-gradient(90deg,#38b2ac,#319795)", border: "#2c7a7b", text: "#ffffff" }, // level 0
    { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" }, // level 1
    { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3" }, // level 2
    { bg: "#dcfce7", border: "#16a34a", text: "#064e3b" }, // level 3
    { bg: "#fee2e2", border: "#dc2626", text: "#7f1d1d" }, // level 4+
  ],
  dark: [
    { bg: "#0f1724", border: "#24303b", text: "#e6eef7" },
    { bg: "#1e293b", border: "#334155", text: "#e2e8f0" },
    { bg: "#0f2f2b", border: "#10b981", text: "#d1fae5" },
    { bg: "#1e1b4b", border: "#6366f1", text: "#c7d2fe" },
    { bg: "#3f1d1d", border: "#ef4444", text: "#fecaca" },
  ],
  blueprint: [
    { bg: "#e8f1fb", border: "#93c5fd", text: "#0f1724" },
    { bg: "#f0f7ff", border: "#60a5fa", text: "#0b2540" },
    { bg: "#e8eefd", border: "#3b82f6", text: "#1e3a8a" },
    { bg: "#e0edff", border: "#2563eb", text: "#1e40af" },
    { bg: "#fde2e2", border: "#dc2626", text: "#7f1d1d" },
  ],
  bold: [
    { bg: "#4edb16ff", border: "#166534", text: "#073b1a" },
    { bg: "#fff3c4", border: "#f59e0b", text: "#7c2d12" },
    { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3" },
    { bg: "#ecfdf5", border: "#10b981", text: "#064e3b" },
    { bg: "#fff0f6", border: "#ec4899", text: "#4c0519" },
  ],
};

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

// ✅ LEVEL-BASED STYLE SELECTION
const getNodeStyle = (data: FlowNodeData) => {
  const paletteSet = COLOR_PALETTES[data.mapMode ?? "default"];
  const level = Math.min(data.level ?? 0, paletteSet.length - 1);
  let base = paletteSet[level];

  // Keep your overrides exactly the same
  if (data.status && data.status >= 400) base = paletteSet[4];
  else if (data.isRedirect) base = { bg: "#e5e7eb", border: "#6b7280", text: "#111827" };
  else if (data.isNoIndex) base = { bg: "#fef9c3", border: "#eab308", text: "#92400e" };

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
