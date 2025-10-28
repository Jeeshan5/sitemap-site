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
import { Loader2, AlertTriangle, XCircle, Download, Maximize2, ExternalLink } from 'lucide-react'

// Custom styles for React Flow controls
const customControlStyles = `
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
  .custom-node {
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .custom-node:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.3) !important;
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
}

// Color schemes for different hierarchy levels
const getNodeColor = (level: number): { bg: string; border: string; text: string } => {
  const colors = [
    { bg: '#14b8a6', border: '#0d9488', text: '#ffffff' }, // Root - Teal
    { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' }, // Level 1 - Blue
    { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff' }, // Level 2 - Purple
    { bg: '#ec4899', border: '#db2777', text: '#ffffff' }, // Level 3 - Pink
    { bg: '#f59e0b', border: '#d97706', text: '#ffffff' }, // Level 4 - Orange
    { bg: '#84cc16', border: '#65a30d', text: '#ffffff' }, // Level 5 - Lime
  ]
  return colors[Math.min(level, colors.length - 1)]
}

function FlowCanvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect }: FlowCanvasProps) {
  const { fitView } = useReactFlow()

  const handleFitViewClick = useCallback(() => {
    fitView({ duration: 800, padding: 0.3 })
  }, [fitView])

  const handleInit = useCallback((reactFlowInstance: ReactFlowInstance) => {
    setTimeout(() => reactFlowInstance.fitView({ padding: 0.25 }), 150)
  }, [])

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={handleInit}
        fitView
        minZoom={0.1}
        maxZoom={4}
        attributionPosition="bottom-left"
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Controls showZoom showFitView showInteractive position="top-right" />
        <MiniMap
          nodeColor={(node: Node) => {
            const nodeData = node.data as { level?: number }
            const level = nodeData.level || 0
            return getNodeColor(level).bg
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

        <Panel
          position="top-left"
          className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3"
        >
          <button
            onClick={handleFitViewClick}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-medium text-sm"
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
  const [showCanvas, setShowCanvas] = useState<boolean>(false)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const convertToFlowData = useCallback(
    (data: { pages?: SitemapNode[] }): { nodes: Node[]; edges: Edge[] } => {
      const flowNodes: Node[] = []
      const flowEdges: Edge[] = []
      let nodeId = 0

      const processNode = (
        node: SitemapNode,
        parentId: string | null = null,
        level: number = 0,
        xOffset: number = 0,
        yOffset: number = 0
      ): number => {
        const currentNodeId = `node-${nodeId++}`
        const colors = getNodeColor(level)

        const handleNodeClick = (url: string) => {
          window.open(url, '_blank', 'noopener,noreferrer')
        }

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
                  /* ensure background fully covers text and allow expansion */
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: level === 0 ? '18px 26px' : '14px 20px',
                  minWidth: level === 0 ? '240px' : '200px',
                  width: 'auto',
                  boxSizing: 'border-box',
                  background: colors.bg,
                  color: colors.text,
                  borderRadius: '12px',
                  boxShadow: '0 6px 14px rgba(0,0,0,0.12)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  overflow: 'visible', // important to avoid clipping
                  wordBreak: 'break-word',
                }}
                onClick={() => handleNodeClick(node.url)}
              >
                <div
                  style={{
                    fontWeight: '600',
                    fontSize: level === 0 ? '15px' : '13px',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    lineHeight: 1.1,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ display: 'inline-block' }}>{node.title || 'Untitled'}</span>
                  <ExternalLink size={level === 0 ? 14 : 12} style={{ opacity: 0.85 }} />
                </div>
                {/* show url for root nodes only (as before) */}
                {level === 0 && (
                  <div
                    style={{
                      fontSize: '11px',
                      opacity: 0.95,
                      fontWeight: '400',
                      wordBreak: 'break-word',
                      whiteSpace: 'normal',
                      maxWidth: '100%',
                      lineHeight: 1.3,
                      marginTop: '4px',
                    }}
                  >
                    {node.url}
                  </div>
                )}
              </div>
            ),
          },
          position: { x: xOffset, y: yOffset },
          style: {
            // keep external style minimal because the label contains background now
            background: 'transparent',
            color: colors.text,
            border: `2px solid ${colors.border}`,
            borderRadius: '12px',
            boxShadow: 'none',
            fontSize: level === 0 ? '14px' : '13px',
            fontWeight: '600',
          },
          draggable: true,
        })

        if (parentId) {
          flowEdges.push({
            id: `edge-${parentId}-${currentNodeId}`,
            source: parentId,
            target: currentNodeId,
            type: 'smoothstep',
            animated: level === 1,
            style: {
              stroke: '#64748b',
              strokeWidth: 2.5,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#64748b',
              width: 20,
              height: 20,
            },
          })
        }

        if (node.children && node.children.length > 0) {
          const childSpacing = 280
          const totalWidth = (node.children.length - 1) * childSpacing
          const startX = xOffset - totalWidth / 2
          node.children.forEach((child, index) => {
            const childX = startX + index * childSpacing
            const childY = yOffset + 180
            processNode(child, currentNodeId, level + 1, childX, childY)
          })
        }

        return xOffset
      }

      if (data.pages && data.pages.length > 0) {
        const pageSpacing = 420
        const totalWidth = (data.pages.length - 1) * pageSpacing
        const startX = -totalWidth / 2
        data.pages.forEach((page, index) => {
          const pageX = startX + index * pageSpacing
          processNode(page, null, 0, pageX, 0)
        })
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
    setShowCanvas(false)

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
      setShowCanvas(true)

      if (data.warnings) setWarnings(data.warnings)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError({ error: message || 'Error generating visual sitemap' })
    } finally {
      setLoading(false)
    }
  }

  const downloadAsImage = async (): Promise<void> => {
    const element = document.querySelector('.react-flow__viewport') as HTMLElement
    if (!element) {
      alert('Canvas not found. Please try again.')
      return
    }

    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(element, {
        backgroundColor: '#ffffff',
        quality: 1.0,
        pixelRatio: 4, // higher for crisp output
        cacheBust: true,
        filter: (node: HTMLElement) => {
          const exclusions = ['react-flow__minimap', 'react-flow__controls', 'react-flow__panel']
          return !exclusions.some((cls) => node.classList?.contains(cls))
        },
      })
      const link = document.createElement('a')
      link.download = `sitemap-${new Date().getTime()}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Error downloading image:', err)
      alert('Failed to download image. Please try again.')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') generateVisual()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-slate-800/50 border-b border-slate-700 shadow-lg backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Visual Sitemap Builder
              </h1>
              <p className="text-slate-400 mt-2 text-sm sm:text-base">
                Interactive tree-structure sitemap with clickable nodes
              </p>
            </div>

            {showCanvas && (
              
              
              <button
                onClick={downloadAsImage}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition shadow-lg font-medium"
                type="button"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Download HD PNG</span>
                <span className="sm:hidden">Download</span>
              </button>
              
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!showCanvas && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-700 max-w-2xl mx-auto">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Enter Website URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-4 border-2 border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-900 text-white placeholder-slate-500 transition"
                  onKeyPress={handleKeyPress}
                />
              </div>

              <button
                onClick={generateVisual}
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-4 rounded-xl hover:from-cyan-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-semibold shadow-lg text-base sm:text-lg"
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
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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
            </div>

            {error && error.issues && error.issues.length > 0 && (
              <div className="mt-6 p-4 bg-red-900/30 border-l-4 border-red-500 rounded-lg backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <XCircle className="text-red-400 flex-shrink-0 mt-0.5" size={24} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-300 mb-2">Security Issues Detected</h3>
                    <p className="text-red-400 mb-2 text-sm">{error.message}</p>
                    <ul className="list-disc list-inside space-y-1">
                      {error.issues.map((issue: string, idx: number) => (
                        <li key={idx} className="text-red-400 text-sm">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {error && !error.issues && (
              <div className="mt-6 p-4 bg-red-900/30 border border-red-800 rounded-lg backdrop-blur-sm">
                <p className="text-red-400 text-sm">{error.error || error.message}</p>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-900/30 border-l-4 border-yellow-500 rounded-lg backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={24} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-300 mb-2">Warnings</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {warnings.map((warn, idx) => (
                        <li key={idx} className="text-yellow-400 text-sm">
                          {warn}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {showCanvas && (
          <div className="mt-8 bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300 h-[85vh]">
            <ReactFlowProvider>
              <FlowCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
              />
            </ReactFlowProvider>
          </div>
        )}
      </div>

      <style>{customControlStyles}</style>
    </div>
  )
}

export default VisualSitemapContent
