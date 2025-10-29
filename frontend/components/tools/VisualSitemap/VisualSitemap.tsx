'use client'

import { useState, useCallback } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
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
  useReactFlow,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Loader2,
  Download,
  Maximize2,
  ExternalLink,
  Share2,
  RotateCcw,
} from 'lucide-react'
import ExportModal from '@/components/tools/ExportModal' // Assuming this path is correct

// --- Custom styles for React Flow controls and custom nodes ---
const customControlStyles = `
  /* React Flow controls styling */
  .react-flow__controls {
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3) !important;
  }
  .react-flow__controls-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    border: none !important;
    border-bottom: 2px solid rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    transition: all 0.2s ease !important;
  }
  .react-flow__controls-button:hover {
    background: linear-gradient(135deg, #5a67d8 0%, #6b3fa0 100%) !important;
    transform: scale(1.05) !important;
  }
  .react-flow__controls-button svg {
    fill: white !important;
  }

  /* Custom node styling (matching octopus.do like aesthetic) */
  .custom-node {
    border-radius: 8px; /* Slightly rounded corners */
    overflow: hidden;
    background: white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.07);
    transition: all 0.2s ease;
    border: 1px solid #e2e8f0; /* Light grey border */
  }
  .custom-node:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px -5px rgba(0, 0, 0, 0.15) !important;
  }
  .custom-node-link {
    display: flex;
    align-items: center;
    color: white; /* Icon color in header */
    opacity: 0.8;
    transition: opacity 0.2s ease;
  }
  .custom-node-link:hover {
    opacity: 1;
  }
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
}

interface FlowCanvasProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  onInit: (instance: ReactFlowInstance) => void
}

// --- Node color scheme (refined for octopus.do aesthetic from your images) ---
const getNodeColor = (level: number): { bg: string; border: string; text: string } => {
  // Level 0 (Main page) is a slightly desaturated teal gradient
  if (level === 0) {
    return { bg: 'linear-gradient(90deg, #38b2ac 0%, #319795 100%)', border: '#2c7a7b', text: '#ffffff' } // Teal gradient
  }
  // All other levels are a solid purple
  return { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff' } // Purple
}

const nodeTypes = {}
const edgeTypes = {}

function FlowCanvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onInit }: FlowCanvasProps) {
  const { fitView } = useReactFlow()

  const handleFitViewClick = useCallback(() => {
    fitView({ duration: 800, padding: 0.3 })
  }, [fitView])

  return (
    // Canvas now takes up full screen
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        fitView // Keep fitView enabled for automatic initial fit
        minZoom={0.1}
        maxZoom={4}
        attributionPosition="bottom-left"
      >
        <Controls showZoom showFitView showInteractive position="top-right" />
        <MiniMap
          nodeColor={(node: Node) => {
            const nodeData = node.data as { level?: number }
            const level = nodeData.level || 0
            // Return solid color for minimap for clarity
            return level === 0 ? '#38b2ac' : '#8b5cf6'
          }}
          maskColor="rgba(30, 41, 59, 0.8)"
          position="bottom-left"
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={30}
          size={2.5}
          color="#e2e8f0"
          className="bg-white"
        />

        {/* Fit View button as a panel, matching screenshot */}
        <Panel
          position="top-left"
          className="z-10"
          style={{ top: '80px', left: '16px' }}
        >
          <button
            onClick={handleFitViewClick}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-medium text-sm shadow-lg"
            type="button"
          >
            <Maximize2 size={16} />
            Fit View
          </button>
        </Panel>
      </ReactFlow>
    </div>
  )
}

function VisualSitemapContent() {
  const [url, setUrl] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<ValidationIssue | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([])
  const [showExport, setShowExport] = useState<boolean>(false)
  const [isGenerated, setIsGenerated] = useState<boolean>(false)
  
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // --- Node data conversion with octopus.do inspired styling ---
  const convertToFlowData = useCallback(
    (data: { pages?: SitemapNode[] }): { nodes: Node[]; edges: Edge[] } => {
      const flowNodes: Node[] = []
      const flowEdges: Edge[] = []
      let nodeId = 0
      const nodeWidth = 280 // Fixed width for consistent design

      const processNode = (
        node: SitemapNode,
        parentId: string | null = null,
        level: number = 0,
        xOffset: number = 0,
        yOffset: number = 0
      ): number => {
        const currentNodeId = `node-${nodeId++}`
        const colors = getNodeColor(level) // This returns an object with bg as string or gradient

        flowNodes.push({
          id: currentNodeId,
          type: 'default',
          data: {
            level,
            url: node.url,
            label: (
              <div
                className="custom-node"
                style={{
                  width: nodeWidth,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {/* Title Bar - Using colors.bg which can be a gradient string */}
                <div
                  style={{
                    background: colors.bg,
                    color: colors.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px', // Adjusted padding
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: '13px', // Adjusted font size
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      paddingRight: '8px',
                    }}
                  >
                    {node.title || 'Untitled Page'}
                  </span>
                  <a
                    href={node.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title={`Open ${node.url}`}
                    className="custom-node-link"
                  >
                    <ExternalLink size={14} /> {/* Adjusted icon size */}
                  </a>
                </div>

                {/* Body - White background with URL */}
                <div
                  style={{
                    padding: '8px 10px', // Adjusted padding
                    fontSize: '10px', // Adjusted font size
                    color: '#475569',
                    wordBreak: 'break-all',
                    background: '#ffffff',
                    minHeight: 30, // Consistent height
                  }}
                >
                  {node.url}
                </div>
              </div>
            ),
          },
          position: { x: xOffset, y: yOffset },
          style: {
            padding: 0,
            border: 'none',
            borderRadius: '8px',
            background: 'transparent',
            width: nodeWidth,
          },
          draggable: true,
        })

        if (parentId) {
          flowEdges.push({
            id: `edge-${parentId}-${currentNodeId}`,
            source: parentId,
            target: currentNodeId,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#cbd5e1', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#cbd5e1',
              width: 15,
              height: 15,
            },
          })
        }

        if (node.children?.length) {
          const childSpacing = nodeWidth + 60
          const totalWidth = (node.children.length - 1) * childSpacing
          const startX = xOffset - totalWidth / 2
          node.children.forEach((child, i) =>
            processNode(
              child,
              currentNodeId,
              level + 1,
              startX + i * childSpacing,
              yOffset + 160
            )
          )
        }
        return xOffset
      }

      if (data.pages?.length) {
        const pageSpacing = nodeWidth + 80
        const totalWidth = (data.pages.length - 1) * pageSpacing
        const startX = -totalWidth / 2
        data.pages.forEach((page, i) =>
          processNode(page, null, 0, startX + i * pageSpacing, 0)
        )
      }
      return { nodes: flowNodes, edges: flowEdges }
    },
    []
  )

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

      const { nodes: flowNodes, edges: flowEdges } = convertToFlowData(data)
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
    setError(null)
    setWarnings([])
    if (reactFlowInstance) {
        reactFlowInstance.zoomTo(1);
        reactFlowInstance.setCenter(0,0);
    }
  }

  const captureEntireCanvas = useCallback(async (format: 'png' | 'svg'): Promise<{ data: string; mime: string }> => {
    if (!reactFlowInstance) throw new Error('ReactFlow instance not available.')

    const originalViewport = reactFlowInstance.getViewport()

    // Manually compute bounding box from nodes because ReactFlowInstance.getRectOfNodes doesn't exist on the type.
    const nodesForBounds = reactFlowInstance.getNodes() || []
    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    // Defaults used when node width/height are not set on the node object
    const defaultNodeWidth = 280
    const defaultNodeHeight = 120

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
      // No nodes available, fallback to a default small bounds
      minX = 0
      minY = 0
      maxX = defaultNodeWidth
      maxY = defaultNodeHeight
    }

    const bounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }

    // Calculate new viewport to fit all nodes for capture; we'll translate so the bounds origin is visible with padding.
    // We don't rely on fitView's return value (it doesn't return an object) — instead compute a simple transform.
    const padding = 50
    const x = -bounds.x + padding
    const y = -bounds.y + padding
    const zoom = 1

    const imageWidth = bounds.width + padding * 2 // Add padding
    const imageHeight = bounds.height + padding * 2 // Add padding

    const element = document.querySelector('.react-flow__viewport') as HTMLElement
    if (!element) throw new Error('Canvas viewport element not found.')

    const lib = await import('html-to-image')
    const filter = (node: HTMLElement) =>
      !['react-flow__minimap', 'react-flow__controls', 'react-flow__panel'].some((cls) =>
        node.classList?.contains(cls)
      ) && !node.classList?.contains('react-flow__attribution')

    let dataUrlOrSvg: string
    let mimeType: string

    // Apply the calculated transform via CSS style for accurate capture
    const captureStyle = {
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
      width: `${imageWidth}px`,
      height: `${imageHeight}px`,
      transformOrigin: 'top left', // Ensure scaling is from top-left
    };

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
    } else { // PNG
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

    // Restore original viewport after capture
    reactFlowInstance.setViewport(originalViewport, { duration: 0 })

    return { data: dataUrlOrSvg, mime: mimeType }
  }, [reactFlowInstance])

  const downloadAsImage = useCallback(async (): Promise<void> => {
    try {
      const { data, mime } = await captureEntireCanvas('png')
      const link = document.createElement('a')
      link.download = `sitemap-${Date.now()}.png`
      link.href = data
      link.click()
    } catch (err) {
      console.error('Error downloading image:', err)
      alert('Failed to download image: ' + (err as Error).message)
    }
  }, [captureEntireCanvas])

  const getExportPayload = useCallback(async (format: string) => {
    if (format === 'png') {
        return captureEntireCanvas('png');
    } else if (format === 'svg') {
        return captureEntireCanvas('svg');
    }
    return captureEntireCanvas('png'); // Default to PNG for PDF or other formats
  }, [captureEntireCanvas])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') generateVisual()
  }

  const onReactFlowInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
    if (nodes.length > 0) {
        setTimeout(() => instance.fitView({ padding: 0.25 }), 150);
    }
  }, [nodes.length]);


  return (
    // Main wrapper ensures full screen, no external scrolling
    <div className="h-screen w-screen bg-white overflow-hidden">
      {/* --- Fixed Header Bar (Always visible) --- */}
      <div className="fixed top-0 left-0 w-full z-50 bg-slate-800 shadow-lg border-b border-slate-700 text-white">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          {/* Title */}
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-slate-100">
              Sitemap Builder
            </span>
            <span className="text-xs text-slate-400 hidden sm:block">Visual Tool</span>
          </div>

          {/* Action buttons (only if sitemap is generated) */}
          {isGenerated && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleGenerateNew}
                className="flex items-center gap-2 bg-yellow-500 text-white px-3 py-1.5 rounded-md hover:bg-yellow-600 transition shadow font-medium text-sm"
                type="button"
              >
                <RotateCcw size={16} />
                <span className="hidden sm:inline">New</span>
              </button>
              <button
                onClick={() => setShowExport(true)}
                className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 transition shadow font-medium text-sm"
                type="button"
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={downloadAsImage}
                className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition shadow font-medium text-sm"
                type="button"
              >
                <Download size={16} />
                <span className="hidden sm:inline">PNG</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- React Flow Canvas (Takes up remaining screen space below header) --- */}
      {/* Adjusted padding-top to account for the header's dynamic height */}
      <div style={{ paddingTop: '56px' }} className="h-full w-full"> 
        <ReactFlowProvider>
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onReactFlowInit}
          />
        </ReactFlowProvider>
      </div>


      {/* --- Floating URL Input Box (Conditional display) --- */}
      {!isGenerated && !loading && (
        <div className="fixed inset-0 flex items-center justify-center z-40 p-4 pt-[60px]"> {/* Adjusted padding-top */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-300 w-[90vw] max-w-2xl text-center">
            <div className="space-y-5">
              <h1 className="text-3xl font-bold text-slate-900">
                Visual Sitemap Builder
              </h1>
              <p className="text-slate-600">
                Enter a URL to start generating your interactive sitemap.
              </p>

              <div>
                <label htmlFor="url-input" className="sr-only">Enter Website URL</label>
                <input
                  id="url-input"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-4 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-slate-900 placeholder-slate-500 transition text-lg"
                  onKeyPress={handleKeyPress}
                />
              </div>

              <button
                onClick={generateVisual}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-3 font-semibold shadow-lg text-base"
                type="button"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={22} />
                    Generating Sitemap...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Generate Visual Sitemap
                  </>
                )}
              </button>

              {/* Error/Warning display */}
              {error && (
                <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 rounded-lg text-left">
                  <h3 className="text-red-800 font-semibold text-sm">Error</h3>
                  <p className="text-red-700 text-sm">{error.error || error.message}</p>
                  {error.issues && (
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {error.issues.map((issue, idx) => (
                        <li key={idx} className="text-red-700 text-sm">{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {warnings.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg text-left">
                  <h3 className="text-yellow-800 font-semibold text-sm">Warnings</h3>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {warnings.map((warn, idx) => (
                      <li key={idx} className="text-yellow-700 text-sm">{warn}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Floating Loading Spinner (Conditional display) --- */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30 pt-[60px]">
          <div className="bg-slate-900/90 backdrop-blur-sm text-white p-6 rounded-lg flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="animate-spin" size={32} />
            <span className="text-xl font-medium">Generating Sitemap...</span>
            <p className="text-sm text-slate-400">This may take a moment depending on site size.</p>
          </div>
        </div>
      )}

      {/* --- Export Modal --- */}
      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          getExportPayload={getExportPayload}
        />
      )}

      {/* Custom CSS for React Flow components */}
      <style>{customControlStyles}</style>
    </div>
  )
}

export default VisualSitemapContent