// frontend/components/tools/VisualSitemap/CustomSitemapNode.tsx
import React, { useCallback, useMemo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ExternalLink, Minus, Plus } from "lucide-react";

type MapMode = "default" | "dark" | "blueprint" | "bold";

const getMapStyles = (
  mode: MapMode,
  level: number
): { bg: string; border: string; text: string; urlText?: string; accent?: string } => {
  if (mode === "dark") {
    return { bg: level === 0 ? "#1e293b" : "#0f172a", border: "#334155", text: "#e2e8f0" };
  }

  if (mode === "blueprint") {
    return level === 0
      ? { bg: "#dbeafe", border: "#60a5fa", text: "#0f172a" }
      : { bg: "#f0f7ff", border: "#93c5fd", text: "#0f172a" };
  }

  if (mode === "bold") {
    if (level === 0)
      return { bg: "#fff3c4", border: "#f59e0b", text: "#7c2d12" };
    if (level === 1)
      return { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3" };
    return { bg: "#ecfdf5", border: "#10b981", text: "#064e3b" };
  }

  // Default
  if (level === 0) {
    return {
      bg: "linear-gradient(90deg,#38b2ac,#319795)",
      border: "#2c7a7b",
      text: "#ffffff",
    };
  }
  return { bg: "#8b5cf6", border: "#7c3aed", text: "#ffffff" };
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

const getNodeStyleColors = (data: FlowNodeData) => {
  const mode = data.mapMode || "default";
  const level = data.level ?? 0;

  // Base color based on map mode + depth
  const base = getMapStyles(mode, level);

  let headerColor = base.bg;
  let textColor = base.text;
  let borderColor = base.border;
  let bodyColor = "#ffffff";

  // Status Overrides
  if (data.status && data.status >= 400) {
    headerColor = "#ef4444";
    textColor = "#ffffff";
    borderColor = "#b91c1c";
    bodyColor = "#fee2e2";
  } else if (data.isRedirect) {
    headerColor = "#9ca3af";
    textColor = "#111827";
    borderColor = "#6b7280";
    bodyColor = "#f3f4f6";
  } else if (data.isNoIndex) {
    headerColor = "#fde047";
    textColor = "#1f2937";
    borderColor = "#ca8a04";
    bodyColor = "#fffbe2";
  }

  // Gradient headers → enforce white text
  if (typeof headerColor === "string" && headerColor.includes("gradient")) {
    textColor = "#ffffff";
  }

  const boxShadow = data.highlight ? `0 0 14px ${borderColor}66` : "none";
  const borderStyle = data.highlight
    ? `2px solid ${borderColor}`
    : `1px solid ${borderColor}`;

  return { headerColor, bodyColor, textColor, borderStyle, boxShadow };
};

const CustomSitemapNode: React.FC<NodeProps<FlowNodeData>> = ({ data, selected }) => {
  const { headerColor, bodyColor, textColor, borderStyle, boxShadow } = useMemo(
    () => getNodeStyleColors(data),
    [data]
  );

  const handleToggleCollapse = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (data.onToggleCollapse && data.url) data.onToggleCollapse(data.url);
    },
    [data]
  );

  const height = 70;

  return (
    <>
      <div
        style={{
          width: data.width ?? 260,
          height,
          borderRadius: 8,
          background: bodyColor,
          border: borderStyle,
          boxShadow,
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        {/* HEADER */}
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
            minHeight: "30px",
          }}
        >
          <span
            style={{
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {data.title || data.url || "Untitled"}
          </span>

          <div style={{ display: "flex", gap: 6 }}>
            {data.hasChildren && (
              <button onClick={handleToggleCollapse} style={{ color: textColor }}>
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

        {/* BODY */}
        <div style={{ padding: "4px 10px", fontSize: "10px", color: "#475569" }}>
          <p className="truncate">{data.url}</p>
          {data.inboundLinks !== undefined && (
            <div className="mt-1 text-xs">
              Links: {data.inboundLinks}
              {data.status && data.status !== 200 && ` | Status: ${data.status}`}
            </div>
          )}
        </div>
      </div>

      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  );
};

export default CustomSitemapNode;
