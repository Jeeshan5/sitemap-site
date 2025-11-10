'use client'

import { useState,useCallback, useEffect } from 'react'
import ReactFlow, {
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  BackgroundVariant,
  ReactFlowProvider,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  ReactFlowInstance,
  NodeTypes,
  EdgeTypes,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Loader2,
  Download,
  Maximize2,
  Share2,
  RotateCcw,
  Minus,
  Plus,
  Search,
  Settings,
  User,
} from 'lucide-react'
import ExportModal from '../ExportModal'
import MetadataPanel from '@/components/shared/MetadataPanel'
import CustomSitemapNode from './CustomSitemapNode'
import SitemapLegend from './SitemapLegend'
import React from 'react'

// --- Custom styles and Layout Fixes ---
const customControlStyles = `
body{overflow:hidden!important;margin:0!important;padding:0!important;height:100vh;width:100vw}
.react-flow,.react-flow__renderer{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}
.react-flow__pane{background-color:var(--rf-bg,#ffffff)}
.custom-node{border-radius:8px;overflow:hidden;background:white;box-shadow:0 4px 10px rgba(0,0,0,0.07);transition:all .2s;border:1px solid #e2e8f0}
.custom-node:hover{transform:translateY(-2px);box-shadow:0 8px 20px -5px rgba(0,0,0,.15)!important}
.custom-node-link{display:flex;align-items:center;color:white;opacity:.8;transition:opacity .2s}.custom-node-link:hover{opacity:1}
.custom-zoom-controls{display:flex;flex-direction:column;align-items:center;justify-content:center;width:56px;height:calc(100vh - 40px);background:rgba(255,255,255,.96);border-radius:0 12px 12px 0;box-shadow:0 6px 24px rgba(0,0,0,.12);overflow:hidden;border:1px solid rgba(226,232,240,.6);padding:8px 6px}
.custom-zoom-controls button{padding:6px;border:0;background:transparent;cursor:pointer;font-size:18px;color:#334155;display:flex;align-items:center;justify-content:center;width:44px;height:44px}
.custom-zoom-controls button:hover{background:#f1f5f9}
.custom-zoom-controls .zoom-percentage{padding:6px 4px;min-width:40px;text-align:center;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#475569}
.visual-bottom-toolbar{display:flex;gap:10px;align-items:center;justify-content:center;background:rgba(255,255,255,.95);padding:8px 14px;border-radius:9999px;box-shadow:0 8px 24px rgba(2,6,23,.08);border:1px solid rgba(226,232,240,.7)}
.visual-zoom-control{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.96);padding:6px 10px;border-radius:9999px;box-shadow:0 6px 18px rgba(2,6,23,.06);border:1px solid rgba(226,232,240,.7)}
.project-settings-panel{max-height:calc(100vh - 120px);overflow:auto}
@media(max-width:768px){.custom-zoom-controls{display:none}.visual-bottom-toolbar{padding:6px 8px;gap:8px}.visual-bottom-toolbar button{padding:6px 8px;font-size:13px}.visual-zoom-control{padding:4px 8px;right:12px;bottom:12px}.visual-top-toolbar{display:none!important}.project-settings-panel{right:8px!important;top:72px!important;width:calc(100% - 24px)!important}.visual-mobile-controls{display:flex!important;top:96px!important;left:50%!important;transform:translateX(-50%)!important;width:calc(100% - 32px)!important;padding:6px 10px!important;box-sizing:border-box;z-index:70!important}.visual-mobile-controls>div{width:100%;background:rgba(255,255,255,.96);border-radius:12px;padding:6px 8px;box-shadow:0 8px 28px rgba(2,6,23,.12);align-items:center}.visual-mobile-controls input[type="search"]{height:40px;font-size:15px;padding-left:12px}.visual-mobile-controls button{width:40px;height:40px;padding:0;display:inline-flex;align-items:center;justify-content:center}.visual-bottom-toolbar{bottom:160px!important;transform:translateY(-20px)}.visual-zoom-control{transform:scale(.82);right:12px!important;bottom:140px!important}}
@media(max-width:768px){
  .visual-legend-panel{display:none}
}
@media(max-width:420px){.visual-top-toolbar{display:none!important}.visual-bottom-toolbar{left:50%!important;transform:translateX(-50%);padding:8px;gap:6px}.visual-bottom-toolbar .hidden.sm\:inline{display:none!important}.project-settings-panel{width:calc(100% - 24px)!important;max-height:calc(100vh - 120px)}.visual-mobile-controls{top:96px!important;left:50%!important;transform:translateX(-50%)!important;display:flex!important;padding:6px 8px!important;width:calc(100% - 32px)!important;box-sizing:border-box}.visual-mobile-controls>div{padding:6px 8px}.visual-bottom-toolbar{bottom:160px!important}.visual-zoom-control{transform:scale(.72);right:10px!important;bottom:160px!important}}
.dark .visual-mobile-controls>div{background:rgba(15,23,36,.92);color:#e6eef7;border:1px solid rgba(255,255,255,.04)}.dark .visual-mobile-controls input{background:transparent;color:#e6eef7;border-color:rgba(255,255,255,.06)}.dark .visual-mobile-controls input::placeholder{color:rgba(226,232,240,.35)}.dark .project-settings-panel{background:#0f1724!important;color:#e6eef7!important;border-color:#1f2937!important}.dark .project-settings-panel .p-4,.dark .project-settings-panel .p-3{color:#e6eef7!important}.dark .project-settings-panel button{color:#e6eef7!important}.visual-mobile-controls{display:none}
`
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface ValidationIssue {
  error?: string
  issues?: string[]
  warnings?: string[]
  isSafe?: boolean
  message?: string
  suggestion?: string
}

interface SitemapNode {
  url: string
  title?: string
  children?: SitemapNode[]
  status: number
  isNoIndex: boolean
  isRedirect: boolean
  inboundLinks: number
  trafficScore?: number
  isCollapsed?: boolean
  level: number
  wordCount?: number
  metaTags?: Record<string, string>
}

interface FlowNodeData {
  level?: number
  url?: string
  title?: string
  highlight?: boolean
  label?: React.ReactNode
  status?: number
  isNoIndex?: boolean
  isRedirect?: boolean
  inboundLinks?: number
  isCollapsed?: boolean
  hasChildren?: boolean
  onToggleCollapse?: (url: string) => void
  mapMode?: 'default' | 'dark' | 'blueprint' | 'bold'
  width?: number | string
}

interface FlowCanvasProps {
  nodes: Node<FlowNodeData>[]
  edges: Edge[]
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onInit: (instance: ReactFlowInstance) => void
  onConnect: (connection: Connection) => void
  isGenerated: boolean
  handleGenerateNew: () => void
  setShowExport: (show: boolean) => void
  downloadAsImage: () => void
  reactFlowInstance: ReactFlowInstance | null
  onMove?: (e: { viewport?: { zoom?: number } }) => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitView?: () => void
  onNodeClick?: (e: React.MouseEvent, node: Node<FlowNodeData>) => void
  zoomLevel?: number
  mapMode?: 'default' | 'dark' | 'blueprint' | 'bold'
}

const getMapStyles = (mode: string, level: number): { bg: string; border: string; text: string; headerBg?: string; urlText?: string; accent?: string } => {
  if (mode === 'dark') {
    return { bg: '#0f1724', border: '#24303b', text: '#e6eef7', headerBg: '#0b1220', urlText: '#cbd5e1', accent: '#06b6d4' }
  }
  if (mode === 'blueprint') {
    if (level === 0) return { bg: '#e8f1fb', border: '#93c5fd', text: '#0f1724', headerBg: '#d9eafc', urlText: '#0b2540', accent: '#3b82f6' }
    return { bg: '#f0f7ff', border: '#60a5fa', text: '#0b2540', headerBg: '#eaf4ff', urlText: '#075985', accent: '#2563eb' }
  }
  if (mode === 'bold') {
    if (level === 0) return { bg: '#4edb16ff', border: '#92400e', text: '#7c2d12', headerBg: '#fff1e6', urlText: '#92400e', accent: '#dd2810ff' }
    if (level === 1) return { bg: '#eef2ff', border: '#3730a3', text: '#1f2937', headerBg: '#eef2ff', urlText: '#3730a3', accent: '#6366f1' }
    if (level === 2) return { bg: '#f0fdf4', border: '#065f46', text: '#064e3b', headerBg: '#ecfdf5', urlText: '#065f46', accent: '#10b981' }
    return { bg: '#fff0f6', border: '#9f1239', text: '#4c0519', headerBg: '#fff0f6', urlText: '#9f1239', accent: '#ec4899' }
  }

  if (level === 0) {
    return { bg: 'linear-gradient(90deg, #38b2ac 0%, #319795 100%)', border: '#2c7a7b', text: '#111010ff', headerBg: undefined, urlText: '#ffffff', accent: '#10b981' }
  }
  return { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff', headerBg: undefined, urlText: '#ffffff', accent: '#8b5cf6' }
}

const NODE_TYPES: NodeTypes = {}
const EDGE_TYPES: EdgeTypes = {}
NODE_TYPES['sitemapNode'] = CustomSitemapNode
NODE_TYPES['custom'] = CustomSitemapNode

function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onInit,
  isGenerated,
  handleGenerateNew,
  setShowExport,
  downloadAsImage,
  onNodeClick,
  onZoomIn,
  onZoomOut,
  onFitView,
  zoomLevel,
  mapMode,
}: FlowCanvasProps) {
  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodeClick={onNodeClick}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        fitView={false}
        minZoom={0.05}
        maxZoom={4}
        attributionPosition="bottom-left"
        className="bg-white"
        style={{ width: '100%', height: '100%' }}
      >
        <MiniMap
          nodeStrokeColor={(n) => getMapStyles(mapMode ?? 'default', (n.data?.level as number) ?? 0).border}
          nodeColor={(n) => getMapStyles(mapMode ?? 'default', (n.data?.level as number) ?? 0).bg}
          nodeBorderRadius={8}
          maskColor="rgba(30, 41, 59, 0.08)"
          position="bottom-right"
        />
        <Background variant={BackgroundVariant.Dots} gap={30} size={2.5} color="#e2e8f0" />

        <Panel
          position="bottom-left"
          className="z-50"
          style={{ left: '50%', transform: 'translateX(-50%)', bottom: '22px' }}
        >
          {isGenerated && (
            <div className="visual-bottom-toolbar">
              <button
                onClick={handleGenerateNew}
                className="flex items-center gap-2 bg-white text-slate-700 px-3 py-2 rounded-full hover:bg-slate-50 transition shadow-sm font-medium text-sm"
                type="button"
                title="New"
              >
                <RotateCcw size={16} />
                <span className="hidden sm:inline">New</span>
              </button>

              <button
                onClick={() => setShowExport(true)}
                className="flex items-center gap-2 bg-white text-slate-700 px-3 py-2 rounded-full hover:bg-slate-50 transition shadow-sm font-medium text-sm"
                type="button"
                title="Export"
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                onClick={downloadAsImage}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full shadow-xl hover:from-emerald-600 hover:to-emerald-700 transition transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 font-semibold text-sm"
                type="button"
                aria-label="Download PNG"
                title="Download PNG"
              >
                <span className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full">
                  <Download size={14} />
                </span>
                <span className="hidden sm:inline">PNG</span>
              </button>

              <button
                onClick={() => onFitView?.()}
                className="flex items-center gap-2 bg-white text-slate-700 px-3 py-2 rounded-full hover:bg-slate-50 transition shadow-sm font-medium text-sm"
                type="button"
                title="Fit View"
              >
                <Maximize2 size={16} />
                <span className="hidden sm:inline">Fit View</span>
              </button>
            </div>
          )}
        </Panel>

        <Panel
          position="bottom-right"
          className="z-40"
          style={{ right: '20px', bottom: '18px' }}
        >
          {/* Legend Panel */}
<Panel
  position="top-left"
  className="z-40 visual-legend-panel"
  style={{ left: '20px', top: '20px' }}
>
  {isGenerated && <SitemapLegend theme={mapMode === 'dark' ? 'dark' : 'light'} />}
</Panel>
          <div className="visual-zoom-control" style={{ alignItems: 'center' }}>
            <button
              onClick={() => onZoomOut?.()}
              title="Zoom Out"
              aria-label="Zoom Out"
              className="p-2 rounded-md"
              style={{ background: mapMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'transparent', color: getMapStyles(mapMode ?? 'default', 0).accent }}
            >
              <Minus />
            </button>
            <div className="zoom-percentage" style={{ fontWeight: 700, color: getMapStyles(mapMode ?? 'default', 0).accent }}>{zoomLevel ?? 100}%</div>
            <button
              onClick={() => onZoomIn?.()}
              title="Zoom In"
              aria-label="Zoom In"
              className="p-2 rounded-md"
              style={{ background: mapMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'transparent', color: getMapStyles(mapMode ?? 'default', 0).accent }}
            >
              <Plus />
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
function VisualSitemapContent() {
  const hasAutoGenerated = React.useRef(false);
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const [url, setUrl] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<ValidationIssue | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sitemap_theme');
        if (saved === 'dark' || saved === 'light') {
          return saved as 'dark' | 'light';
        }
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
      } catch {}
    }
    return 'light';
  });
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeData>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [mapMode, setMapMode] = useState<'default' | 'dark' | 'blueprint' | 'bold'>('default')
  const [layoutMode, setLayoutMode] = useState<'default' | 'vertical'>('default')
  const [sitemapRaw, setSitemapRaw] = useState<{ pages?: SitemapNode[] } | null>(null)
  const [selectedNode, setSelectedNode] = useState<FlowNodeData | null>(null)
  const [showExport, setShowExport] = useState<boolean>(false)
  const [isGenerated, setIsGenerated] = useState<boolean>(false)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [zoomLevel, setZoomLevel] = useState<number>(0)

  const onZoomIn = useCallback(() => {
    if (!reactFlowInstance) return
    const vp = reactFlowInstance.getViewport()
    const newZoom = Math.min(vp.zoom * 1.12, 4)
    reactFlowInstance.setViewport({ x: vp.x, y: vp.y, zoom: newZoom })
    setZoomLevel(Math.round(newZoom * 100))
  }, [reactFlowInstance])

  const onZoomOut = useCallback(() => {
    if (!reactFlowInstance) return
    const vp = reactFlowInstance.getViewport()
    const newZoom = Math.max(vp.zoom * 0.88, 0.05)
    reactFlowInstance.setViewport({ x: vp.x, y: vp.y, zoom: newZoom })
    setZoomLevel(Math.round(newZoom * 100))
  }, [reactFlowInstance])

  const onFitView = useCallback(() => {
    if (!reactFlowInstance) return
    reactFlowInstance.fitView({ padding: 0.25, duration: 800 })
    setTimeout(() => {
      const vp = reactFlowInstance.getViewport()
      setZoomLevel(Math.round(vp.zoom * 100))
    }, 300)
  }, [reactFlowInstance])

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  const nodeWidth = 280

  const calculateNodeSize = useCallback((inboundLinks: number, allLinks: number[]): number => {
  const MIN_WIDTH = 180;
  const MAX_WIDTH = 420;

  if (!inboundLinks || inboundLinks <= 0) return MIN_WIDTH;

  const maxVal = Math.max(...allLinks, 1);
  const scale = Math.log(inboundLinks + 1) / Math.log(maxVal + 1);

  return MIN_WIDTH + (MAX_WIDTH - MIN_WIDTH) * scale;
}, []);


  const toggleCollapse = useCallback((urlToToggle: string) => {
    if (!sitemapRaw) return
    const traverseAndUpdate = (nodes: SitemapNode[] | undefined): SitemapNode[] | undefined => {
      if (!nodes) return undefined
      return nodes.map(node => {
        if (node.url === urlToToggle) {
          return { ...node, isCollapsed: !node.isCollapsed }
        }
        if (node.children) {
          return { ...node, children: traverseAndUpdate(node.children) }
        }
        return node
      })
    }
    setSelectedNode(null)
    setSitemapRaw(prevRaw => {
      if (!prevRaw?.pages) return prevRaw
      const newPages = traverseAndUpdate(prevRaw.pages)
      return newPages ? { ...prevRaw, pages: newPages } : prevRaw
    })
  }, [sitemapRaw])

  const convertToFlowData = useCallback((data: { pages?: SitemapNode[] }, mode: string = 'default'): { nodes: Node[]; edges: Edge[] } => {
    const flowNodes: Node[] = []
    const flowEdges: Edge[] = []
    let nodeIdCounter = 0
    const levelHeight = 250
   const BASE_SPACING = 240

    const allLinks: number[] = []
    
    const flattenLinks = (nodes: SitemapNode[] | undefined) => {
      nodes?.forEach(node => {
        allLinks.push(node.inboundLinks ?? 0)
        if (node.children) flattenLinks(node.children)
      })
    }
    
    flattenLinks(data.pages)

    const processNode = (node: SitemapNode, parentId: string | null = null, level: number = 0, xOffset: number = 0): number => {
      const currentNodeId = `node-${nodeIdCounter++}`
      const calculatedWidth = calculateNodeSize(node.inboundLinks ?? 0, allLinks)
      const newYOffset = level * levelHeight
      const hasChildren = !!node.children?.length

      flowNodes.push({
        id: currentNodeId,
        type: 'sitemapNode',
        data: {
          level,
          url: node.url,
          title: node.title,
          highlight: false,
          status: node.status,
          isNoIndex: node.isNoIndex,
          isRedirect: node.isRedirect,
          inboundLinks: node.inboundLinks,
          isCollapsed: node.isCollapsed ?? false,
          hasChildren: hasChildren,
          onToggleCollapse: toggleCollapse,
          mapMode: mode as 'default' | 'dark' | 'blueprint' | 'bold',
          width: calculatedWidth,
        },
        position: { x: xOffset, y: newYOffset },
        style: { padding: 0, border: 'none', background: 'transparent', width: calculatedWidth, height: 70 },
        width: calculatedWidth,
        height: 70,
        draggable: true,
      })

      if (parentId) {
   flowEdges.push({
  id: `edge-${parentId}-${currentNodeId}`,
  source: parentId,
  target: currentNodeId,
  type: "smoothstep",
  animated: false,
  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: "#94a3b8" },
  style: {
    stroke: "#94a3b8",
    strokeWidth: 2,
    opacity: 0.85,
  },
});


      }

      if (node.children?.length && !node.isCollapsed) {
        const visibleChildren = node.children
       const sizes = visibleChildren.map(c => calculateNodeSize(c.inboundLinks ?? 0, allLinks))
const totalWidth = sizes.reduce((a, b) => a + b, 0) + BASE_SPACING * (sizes.length - 1)
let currentX = xOffset - totalWidth / 2

visibleChildren.forEach((child, i) => {
  const childWidth = sizes[i]
  processNode(child, currentNodeId, level + 1, currentX + childWidth / 2)
  currentX += childWidth + BASE_SPACING
})

      }
      return xOffset
    }

    if (data.pages?.length) {
  const sizes = data.pages.map(p =>
    calculateNodeSize(p.inboundLinks ?? 0, allLinks)
  );

  const totalWidth =
    sizes.reduce((sum, w) => sum + w, 0) + BASE_SPACING * (sizes.length - 1);

  let currentX = -totalWidth / 2;

  data.pages.forEach((page, i) => {
    const w = sizes[i];
    const x = currentX + w / 2;
    processNode(page, null, 0, x);
    currentX += w + BASE_SPACING;
  });
}

    return { nodes: flowNodes, edges: flowEdges }
  }, [calculateNodeSize, toggleCollapse])

  const handleNodeClick = useCallback((evt: React.MouseEvent, node: Node<FlowNodeData>) => {
    const traverseFind = (nodes: SitemapNode[] | undefined): SitemapNode | undefined => {
      if (!nodes) return undefined
      for (const n of nodes) {
        if (n.url === node.data.url) return n
        const found = traverseFind(n.children)
        if (found) return found
      }
      return undefined
    }

    if (sitemapRaw?.pages) {
      const fullData = traverseFind(sitemapRaw.pages)
      setSelectedNode((fullData as FlowNodeData) ?? node.data)
    } else {
      setSelectedNode(node.data)
    }
  }, [sitemapRaw])

  const generateVisual = async (): Promise<void> => {
    if (!url) {
      setError({ error: 'Please enter a URL' })
      return
    }

    setLoading(true)
    setError(null)
    setWarnings([])
    setNodes([])
    setEdges([])
    setIsGenerated(false)

    try {
      const response = await fetch(`${API_URL}/generate-visual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data)
        return
      }

      setSitemapRaw(data)

  const { nodes: flowNodes, edges: flowEdges } = convertToFlowData(data, mapMode)
      setNodes(flowNodes)
      setEdges(flowEdges)
      setIsGenerated(true)
      if (data.warnings) setWarnings(data.warnings)

      if (reactFlowInstance) {
        setTimeout(() => reactFlowInstance.fitView({ padding: 0.25, duration: 800 }), 100)
      }
    } catch (err: unknown) {
      setError({ error: err instanceof Error ? err.message : 'Error generating sitemap' })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateNew = () => {
    setIsGenerated(false)
    setNodes([])
    setEdges([])
    setUrl('')
    setSelectedNode(null)
    setError(null)
    setWarnings([])
    if (reactFlowInstance) {
      reactFlowInstance.zoomTo(1)
      reactFlowInstance.setCenter(0, 0)
    }
  }

  const captureEntireCanvas = useCallback(async (format: 'png' | 'svg'): Promise<{ data: string; mime: string }> => {
    if (!reactFlowInstance) throw new Error('ReactFlow instance not available.')

    const originalViewport = reactFlowInstance.getViewport()

    const nodesForBounds = reactFlowInstance.getNodes() || []
    let minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY
    const defaultNodeWidth = 280, defaultNodeHeight = 120

    nodesForBounds.forEach((node) => {
      const pos = (node.position as { x?: number; y?: number }) || { x: 0, y: 0 }
      const x = typeof pos.x === 'number' ? pos.x : 0
      const y = typeof pos.y === 'number' ? pos.y : 0
      const w = typeof (node.width as number) === 'number' ? (node.width as number) : defaultNodeWidth
      const h = typeof (node.height as number) === 'number' ? (node.height as number) : defaultNodeHeight

      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + w)
      maxY = Math.max(maxY, y + h)
    })

    if (minX === Number.POSITIVE_INFINITY) {
      minX = 0; minY = 0; maxX = defaultNodeWidth; maxY = defaultNodeHeight
    }

    const bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    const padding = 50
    const x = -bounds.x + padding, y = -bounds.y + padding, zoom = 1
    const imageWidth = bounds.width + padding * 2
    const imageHeight = bounds.height + padding * 2

    const element = document.querySelector('.react-flow__viewport') as HTMLElement
    if (!element) throw new Error('Canvas viewport element not found.')

    const lib = await import('html-to-image')
    const filter = (node: HTMLElement) =>
      !['react-flow__minimap', 'react-flow__controls', 'react-flow__panel'].some((cls) =>
        node.classList?.contains(cls)
      ) && !node.classList?.contains('react-flow__attribution')

    const captureStyle = {
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
      width: `${imageWidth}px`,
      height: `${imageHeight}px`,
      transformOrigin: 'top left',
    }

    let dataUrlOrSvg: string
    let mimeType: string

    if (format === 'svg') {
      dataUrlOrSvg = await lib.toSvg(element, {
        backgroundColor: '#ffffff',
        cacheBust: true,
        filter,
        width: imageWidth,
        height: imageHeight,
        style: captureStyle,
      })
      mimeType = 'image/svg+xml'
    } else {
      dataUrlOrSvg = await lib.toPng(element, {
        backgroundColor: '#ffffff',
        quality: 1.0,
        pixelRatio: 6,
        cacheBust: true,
        filter,
        width: imageWidth,
        height: imageHeight,
        style: captureStyle,
      })
      mimeType = 'image/png'
    }

    reactFlowInstance.setViewport(originalViewport, { duration: 0 })
    return { data: dataUrlOrSvg, mime: mimeType }
  }, [reactFlowInstance])

  const downloadAsImage = useCallback(async (): Promise<void> => {
    try {
      const { data } = await captureEntireCanvas('png')
      const link = document.createElement('a')
      link.download = `sitemap-${Date.now()}.png`
      link.href = data
      link.click()
    } catch (err) {
      console.error('Error downloading image:', err)
      alert('Failed to download image: ' + (err as Error).message)
    }
  }, [captureEntireCanvas])

  // Corrected logic:
  const getExportPayload = useCallback(async (format: string) => {
    // FIX: Explicitly include 'pdf' here and force it to use SVG capture.
    if (format === 'svg' || format === 'png' || format === 'pdf') {
      // PDF conversion works best when based on vector (SVG) data.
      const captureFormat = format === 'pdf' ? 'svg' : (format as 'png' | 'svg');

      // Note: captureEntireCanvas returns the data URL of the image/svg
      const payload = await captureEntireCanvas(captureFormat);
      
      // If requesting PDF, we send the SVG payload data but label it as 'pdf' for the server.
      if (format === 'pdf') {
          return { data: payload.data, mime: payload.mime, format: 'pdf' };
      }
      return payload;
    }

 if (format === 'txt') {
 if (!sitemapRaw || !sitemapRaw.pages) return null
 const gather = (nodes?: SitemapNode[]): string[] => {
 if (!nodes) return []
 let out: string[] = []
 nodes.forEach((n: SitemapNode) => {
 if (n.url) out.push(n.url)
 if (n.children) out = out.concat(gather(n.children))
})
 return out
}
 const urls = gather(sitemapRaw.pages)
 return { data: urls.join('\n'), mime: 'text/plain' }
 }

 return null
 }, [captureEntireCanvas, sitemapRaw])
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') generateVisual()
  }

  const onReactFlowInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance)
    if (nodes.length > 0) {
      setTimeout(() => instance.fitView({ padding: 0.25 }), 150)
    }
  }, [nodes.length])

  const performSearch = useCallback(() => {
    const q = (searchQuery || '').trim().toLowerCase()
    if (!q) {
      setNodes((ns) => ns.map((n) => ({
        ...n,
        data: {
          ...n.data,
          highlight: false,
        },
      })))
      return
    }

    const match = nodes.find((n) => {
      const title = ((n.data?.title as string) || '').toString().toLowerCase()
      const url = ((n.data?.url as string) || '').toString().toLowerCase()
      return title.includes(q) || url.includes(q)
    })

    if (!match) {
      setNodes((ns) => ns.map((n) => ({
        ...n,
        data: {
          ...n.data,
          highlight: false,
        },
      })))
      alert('No matching nodes found')
      return
    }

    setNodes((ns) => ns.map((n) => {
      const is = n.id === match.id
      return {
        ...n,
        data: {
          ...n.data,
          highlight: is,
        },
      }
    }))

    if (reactFlowInstance) {
      const pos = match.position as { x: number; y: number }
      const w = (match.width as number) || nodeWidth
      const h = (match.height as number) || 70
      const centerX = pos.x + w / 2
      const centerY = pos.y + h / 2
      try {
        reactFlowInstance.setCenter(centerX, centerY, { zoom: 1.5, duration: 800 })
      } catch {
        const vp = reactFlowInstance.getViewport()
        reactFlowInstance.setViewport({ x: vp.x, y: vp.y, zoom: vp.zoom })
      }
    }
  }, [searchQuery, nodes, reactFlowInstance, setNodes])

  // On mount, read ?url= param and auto-generate if present
  useEffect(() => {
  const urlParam = searchParams?.get("url");
  if (urlParam && !hasAutoGenerated.current) {
    hasAutoGenerated.current = true; // prevent endless crawling loop
    setUrl(urlParam);
    setTimeout(() => {
      generateVisual();
    }, 200);
  }
}, [searchParams]);
// REMOVE generateVisual from dependencies


  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
        localStorage.setItem('sitemap_theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('sitemap_theme', 'light')
      }
    } catch {
      // ignore
    }
  }, [theme])

  useEffect(() => {
    try {
      if (mapMode === 'dark') {
        document.documentElement.style.setProperty('--rf-bg', theme === 'dark' ? '#0b1220' : '#0f1724')
      } else {
        document.documentElement.style.setProperty('--rf-bg', theme === 'dark' ? '#0f1724' : '#ffffff')
      }
    } catch {
      // ignore
    }
  }, [mapMode, theme])

  useEffect(() => {
    if (!sitemapRaw) return
    try {
      const { nodes: newNodes, edges: newEdges } = convertToFlowData(sitemapRaw, mapMode)
      setNodes(newNodes)
      setEdges(newEdges)
    } catch (e) {
      console.error('Failed to update map mode', e)
    }
  }, [mapMode, sitemapRaw, layoutMode, convertToFlowData, setNodes, setEdges])

  useEffect(() => {
    if (!sitemapRaw) return
    try {
      const { nodes: newNodes, edges: newEdges } = convertToFlowData(sitemapRaw, mapMode)
      setNodes(newNodes)
      setEdges(newEdges)

      if (reactFlowInstance && newNodes.length > 0) {
        setTimeout(() => {
          reactFlowInstance.fitView({ padding: 0.25, duration: 600 })
        }, 100)
      }
    } catch (e) {
      console.error('Failed to re-layout sitemap', e)
    }
  }, [layoutMode, sitemapRaw, convertToFlowData, mapMode, setNodes, setEdges, reactFlowInstance])

  return (
    <div className={`fixed inset-0 overflow-hidden pt-[60px] ${isGenerated ? 'bg-white text-slate-900' : (theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900')}`}>
      <div className="h-full w-full">
        <ReactFlowProvider>
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onReactFlowInit}
            onNodeClick={handleNodeClick}
            isGenerated={isGenerated}
            handleGenerateNew={handleGenerateNew}
            setShowExport={setShowExport}
            downloadAsImage={downloadAsImage}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onFitView={onFitView}
            zoomLevel={zoomLevel}
            mapMode={mapMode}
            reactFlowInstance={reactFlowInstance}
          />
          
        </ReactFlowProvider>
      </div>

      <div className="fixed z-70 visual-top-toolbar" style={{ right: 20, top: 86 }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className={`w-40 sm:w-56 px-3 py-2 rounded-full border focus:outline-none focus:ring-2 ${theme === 'dark' ? 'border-slate-600 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
              onKeyDown={(e) => { if (e.key === 'Enter') performSearch() }}
            />
            <button
              type="button"
              onClick={performSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
              aria-label="Search nodes"
            >
              <Search size={16} />
            </button>
          </div>

          <button
            className={`p-2 rounded-full shadow-sm border flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            title="Project settings"
            onClick={() => setShowSettings((s) => !s)}
            style={{ width: 44, height: 44 }}
            aria-label="Project settings"
          >
            <div style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={16} />
            </div>
          </button>

          <button className={`p-2 rounded-full ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'} shadow-sm`} title="Profile">
            <User size={16} />
          </button>
        </div>
      </div>

     {selectedNode && (
  <>
    {/* Backdrop - click to close */}
    <div 
      className="fixed inset-0 bg-black/30 z-[90] backdrop-blur-sm"
      onClick={() => setSelectedNode(null)}
      aria-hidden="true"
    />
    
    {/* Metadata Panel */}
    <MetadataPanel 
      nodeData={selectedNode as SitemapNode} 
      onClose={() => setSelectedNode(null)} 
      theme={theme} 
    />
  </>
)}
      <div className="visual-mobile-controls fixed z-70" aria-hidden={false}>
        <div className="flex items-center gap-3 w-full justify-center">
          <div className="relative" style={{ flex: '1 1 auto', maxWidth: 420 }}>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className={`w-full px-3 py-2 rounded-full border focus:outline-none focus:ring-2 ${theme === 'dark' ? 'border-slate-600 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
              onKeyDown={(e) => { if (e.key === 'Enter') performSearch() }}
            />
            <button
              type="button"
              onClick={performSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
              aria-label="Search nodes"
            >
              <Search size={16} />
            </button>
          </div>

          <button
            className={`p-2 rounded-full shadow-sm border flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            title="Project settings"
            onClick={() => setShowSettings((s) => !s)}
            aria-label="Project settings"
            style={{ width: 40, height: 40 }}
          >
            <Settings size={16} />
          </button>

          <button className={`p-2 rounded-full ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'} shadow-sm`} title="Profile" aria-label="Profile">
            <User size={16} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div
          className={`fixed right-6 top-20 w-96 rounded-xl shadow-2xl border z-60 project-settings-panel ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
          style={{ zIndex: 200 }}
        >
          <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
            <h3 className="text-lg font-semibold">Project settings</h3>
            <button onClick={() => setShowSettings(false)} className="px-2 py-1 text-slate-500" style={{ zIndex: 300 }} aria-label="Close settings">✕</button>
          </div>
          <div className="p-4">
            <p className="text-sm text-slate-400">Theme</p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setTheme('light')}
                className={`px-3 py-2 rounded-lg border ${theme === 'light' ? 'ring-2 ring-indigo-500 bg-white' : 'bg-transparent'} text-sm`}
              >
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-3 py-2 rounded-lg border ${theme === 'dark' ? 'ring-2 ring-indigo-500 bg-slate-800 text-white' : 'bg-transparent'} text-sm`}
              >
                Dark
              </button>
            </div>
            <hr className="my-4" />
            <p className="text-sm text-slate-400">Map Mode</p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                onClick={() => setMapMode('default')}
                className={`p-3 rounded-lg border shadow-sm flex flex-col items-start gap-2 hover:shadow-md transform hover:-translate-y-0.5 transition ${theme === 'dark' ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'} ${mapMode === 'default' ? 'ring-2 ring-indigo-500' : ''}`}>
                <div className="w-full h-10 rounded-sm overflow-hidden border" style={{ background: 'linear-gradient(90deg,#38b2ac,#319795)' }} />
                <div className="w-full text-sm font-medium">Default</div>
              </button>

              <button
                onClick={() => setMapMode('dark')}
                className={`p-3 rounded-lg border shadow-sm flex flex-col items-start gap-2 hover:shadow-md transform hover:-translate-y-0.5 transition ${theme === 'dark' ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'} ${mapMode === 'dark' ? 'ring-2 ring-indigo-500' : ''}`}>
                <div className="w-full h-10 rounded-sm overflow-hidden border" style={{ background: '#0b1220' }} />
                <div className="w-full text-sm font-medium">Dark</div>
              </button>

              <button
                onClick={() => setMapMode('blueprint')}
                className={`p-3 rounded-lg border shadow-sm flex flex-col items-start gap-2 hover:shadow-md transform hover:-translate-y-0.5 transition ${theme === 'dark' ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'} ${mapMode === 'blueprint' ? 'ring-2 ring-indigo-500' : ''}`}>
                <div className="w-full h-10 rounded-sm overflow-hidden border" style={{ background: '#f0f7ff' }} />
                <div className="w-full text-sm font-medium">Blueprint</div>
              </button>

              <button
                onClick={() => setMapMode('bold')}
                className={`p-3 rounded-lg border shadow-sm flex flex-col items-start gap-2 hover:shadow-md transform hover:-translate-y-0.5 transition ${theme === 'dark' ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'} ${mapMode === 'bold' ? 'ring-2 ring-indigo-500' : ''}`}>
                <div className="w-full h-10 rounded-sm overflow-hidden border" style={{ background: 'linear-gradient(90deg,#fff7ed,#eef2ff)' }} />
                <div className="w-full text-sm font-medium">Bold</div>
              </button>
            </div>

            <p className="text-sm text-slate-400 mt-4">Layout</p>
            <div className="mt-2 flex gap-3">
              <button
                onClick={() => setLayoutMode('default')}
                className={`px-3 py-2 rounded border ${layoutMode === 'default' ? 'ring-2 ring-indigo-500' : 'bg-slate-50'}`}
              >
                Default
              </button>
              <button
                onClick={() => setLayoutMode('vertical')}
                className={`px-3 py-2 rounded border ${layoutMode === 'vertical' ? 'ring-2 ring-indigo-500' : 'bg-slate-50'}`}
              >
                Vertical
              </button>
            </div>
          </div>
        </div>
      )}

      {!isGenerated && !loading && (
        <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-300 w-[90vw] max-w-2xl text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Visual Sitemap Builder</h1>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full p-4 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-lg mb-4"
              onKeyPress={handleKeyPress}
              style={{ color: url ? (getMapStyles(mapMode, 0).accent ?? undefined) : undefined }}
            />
            <button
              onClick={generateVisual}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-3 font-semibold text-base"
              type="button"
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={20} /> Generating Sitemap...</>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Visual Sitemap
                </>
              )}
            </button>
            {error && !(url && !loading) && (
  <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 rounded-lg text-left text-sm">
    <p className="text-red-700 font-semibold">Error: {error.error || error.message}</p>
  </div>
)}

            {warnings.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg text-left text-sm">
                <p className="text-yellow-800 font-semibold">Warnings: {warnings.length} found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-slate-900/90 backdrop-blur-sm text-white p-6 rounded-lg flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="animate-spin" size={32} />
            <span className="text-xl font-medium">Generating Sitemap...</span>
          </div>
        </div>
      )}

      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          initialUrl={url}
          getExportPayload={getExportPayload}
          currentPage={'visual'}
        />
      )}

      <style>{customControlStyles}</style>
    </div>
  )
}

export default VisualSitemapContent