// frontend/components/tools/VisualSitemap/CustomSitemapNode.tsx
import React, { useCallback, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ExternalLink, Minus, Plus } from 'lucide-react';

// --- START: Map Mode & Style Logic from Parent ---

type MapMode = 'default' | 'dark' | 'blueprint' | 'bold'

// Helper for map mode styles
const getMapStyles = (
    mode: MapMode,
    level: number
): { bg: string; border: string; text: string; headerBg?: string; urlText?: string; accent?: string } => {
    if (mode === 'dark') {
        return { bg: '#0f1724', border: '#24303b', text: '#e6eef7', headerBg: '#0b1220', urlText: '#cbd5e1', accent: '#06b6d4' };
    }
    if (mode === 'blueprint') {
        if (level === 0)
            return { bg: '#e8f1fb', border: '#93c5fd', text: '#0f1724', headerBg: '#d9eafc', urlText: '#0b2540', accent: '#3b82f6' };
        return { bg: '#f0f7ff', border: '#60a5fa', text: '#0b2540', headerBg: '#eaf4ff', urlText: '#075985', accent: '#2563eb' };
    }
    if (mode === 'bold') {
        if (level === 0)
            return { bg: '#4edb16ff', border: '#92400e', text: '#7c2d12', headerBg: '#fff1e6', urlText: '#92400e', accent: '#dd2810ff' };
        if (level === 1)
            return { bg: '#eef2ff', border: '#3730a3', text: '#1f2937', headerBg: '#eef2ff', urlText: '#3730a3', accent: '#6366f1' };
        if (level === 2)
            return { bg: '#f0fdf4', border: '#065f46', text: '#064e3b', headerBg: '#ecfdf5', urlText: '#065f46', accent: '#10b981' };
        return { bg: '#fff0f6', border: '#9f1239', text: '#4c0519', headerBg: '#fff0f6', urlText: '#9f1239', accent: '#ec4899' };
    }
    // default mode
    if (level === 0) {
        return {
            bg: 'linear-gradient(90deg, #38b2ac 0%, #319795 100%)',
            border: '#2c7a7b',
            text: '#ffffff',
            headerBg: undefined,
            urlText: '#ffffff',
            accent: '#10b981'
        };
    }
    return { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff', headerBg: undefined, urlText: '#ffffff', accent: '#8b5cf6' };
};

// --- END: Map Mode & Style Logic from Parent ---

interface FlowNodeData {
    url?: string;
    title?: string;
    width?: number | string;
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
    [key: string]: unknown;
}

// --- FIXED: Improved color contrast logic ---
const getNodeStyleColors = (data: FlowNodeData) => {
    const mode = data.mapMode || 'default';
    const level = data.level ?? 0;
    const baseStyles = getMapStyles(mode, level);

    let mainColor = baseStyles.bg;
    let accentColor = baseStyles.accent;
    let textColor = baseStyles.text;
    let urlTextColor = baseStyles.urlText;
    let bodyBgColor = '#ffffff';

    // Adjust body text color for better readability
    if (mode !== 'dark' && mode !== 'bold') {
        urlTextColor = '#334155'; // slate-700
    }

    // Status overrides
    if (data.isRedirect) {
        mainColor = '#a3a3a3';
        accentColor = '#52525b';
        textColor = '#1f2937';
        urlTextColor = '#1f2937';
        bodyBgColor = '#f3f4f6';
    } else if (data.status && data.status >= 400) {
        mainColor = '#ef4444';
        accentColor = '#b91c1c';
        textColor = '#ffffff';
        urlTextColor = '#ffffff';
        bodyBgColor = '#fee2e2';
    } else if (data.isNoIndex) {
        mainColor = '#fde047';
        accentColor = '#facc15';
        textColor = '#1f2937';
        urlTextColor = '#1f2937';
        bodyBgColor = '#fffbe2';
    }

    // --- FIX: Auto-adjust text color for better contrast ---
    const isGradient = typeof mainColor === 'string' && mainColor.includes('gradient');
    if (isGradient) {
        textColor = '#ffffff'; // White text for gradients
    }

    // For very light backgrounds, switch to dark text
    const lightColors = ['#fde047', '#eef2ff', '#f0fdf4', '#fff0f6', '#fffbe2', '#f3f4f6', '#ffffff'];
    if (lightColors.includes(mainColor)) {
        textColor = '#0f172a'; // slate-900
        urlTextColor = '#334155';
    }

    // Highlight/selection styling
    const borderColor = data.highlight || data.selected ? accentColor : baseStyles.border || mainColor;
    const borderStyle = data.highlight ? `2px solid ${accentColor}` : `1px solid ${borderColor}`;
    const boxShadow = data.highlight ? `0 8px 28px ${accentColor}30` : 'none';

    return { mainColor, accentColor, textColor, urlTextColor, borderStyle, boxShadow, bodyBgColor };
};

const CustomSitemapNode: React.FC<NodeProps<FlowNodeData>> = ({ data, selected }) => {
    const { mainColor, textColor, urlTextColor, borderStyle, boxShadow, bodyBgColor } = useMemo(
        () => getNodeStyleColors(data),
        [data]
    );

    React.useEffect(() => {
        console.log('✅ CustomSitemapNode rendered:', {
            url: data.url,
            mapMode: data.mapMode,
            status: data.status,
            selected
        });
    }, [data.url, data.title, data.status, selected, data.mapMode]);

    const handleToggleCollapse = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            console.log('🔄 Toggle collapse clicked for:', data.url, 'Current state:', data.isCollapsed);
            if (data.onToggleCollapse && data.url) {
                data.onToggleCollapse(data.url);
            }
        },
        [data]
    );

    const nodeHeight = 70;

    return (
        <>
            <div
                className={`custom-node-shadow ${selected ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                style={{
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: bodyBgColor,
                    border: borderStyle,
                    boxShadow: boxShadow,
                    width: data.width,
                    height: nodeHeight
                }}
            >
                {/* Header */}
                <div
                    style={{
                        background: mainColor,
                        color: textColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderBottom: `1px solid ${borderStyle}`,
                        minHeight: '30px'
                    }}
                >
                    <span
                        style={{
                            fontWeight: 600,
                            fontSize: '13px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            paddingRight: '8px'
                        }}
                    >
                        {data.title || data.url || 'Untitled Page'}
                    </span>

                    <div className="flex items-center gap-1">
                        {data.hasChildren && (
                            <button
                                onClick={handleToggleCollapse}
                                className="opacity-80 hover:opacity-100 p-1 rounded-sm"
                                style={{ color: textColor }}
                                title={data.isCollapsed ? 'Expand children' : 'Collapse children'}
                            >
                                {data.isCollapsed ? <Plus size={14} /> : <Minus size={14} />}
                            </button>
                        )}

                        {data.url && (
                            <a
                                href={data.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title={`Open ${data.url}`}
                                className="opacity-80 hover:opacity-100 p-1 rounded-sm"
                                style={{ color: textColor }}
                            >
                                <ExternalLink size={14} />
                            </a>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div
                    style={{
                        padding: '4px 10px',
                        fontSize: '10px',
                        color: urlTextColor,
                        background: bodyBgColor,
                        height: nodeHeight - 30,
                        lineHeight: '1.4'
                    }}
                >
                    <p className="truncate" style={{ color: urlTextColor }}>
                        {data.url}
                    </p>
                    <div className="text-xs mt-1" style={{ color: urlTextColor }}>
                        {data.inboundLinks !== undefined && `Links: ${data.inboundLinks}`}
                        {data.status && data.status !== 200 && ` | Status: ${data.status}`}
                    </div>
                </div>
            </div>

            <Handle type="target" position={Position.Top} isConnectable={false} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Bottom} isConnectable={false} style={{ opacity: 0 }} />
        </>
    );
};

export default CustomSitemapNode;