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
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Loader2, AlertTriangle, XCircle, Download, Maximize2 } from 'lucide-react'

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
`

// Environment variable for API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// TypeScript Interfaces
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

// Custom node styles with gradient backgrounds - MOVED OUTSIDE COMPONENT
const getNodeStyle = (level: number): React.CSSProperties => {
  const styles = [
    { 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: '2px solid #5a67d8',
    },
    { 
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      border: '2px solid #ed64a6',
    },
    { 
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      border: '2px solid #3b82f6',
    },
    { 
      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      border: '2px solid #10b981',
    },
    { 
      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      border: '2px solid #f59e0b',
    },
  ]
  
  const style = styles[Math.min(level, styles.length - 1)]
  
  return {
    ...style,
    color: 'white',
    borderRadius: '16px',
    padding: level === 0 ? '20px 28px' : '14px 22px',
    fontSize: level === 0 ? '15px' : '13px',
    fontWeight: '600',
    minWidth: level === 0 ? '220px' : '180px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
  }
}

// FlowCanvas Component - Uses useReactFlow hook for fit view
function FlowCanvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect }: FlowCanvasProps) {
  const { fitView } = useReactFlow()

  const handleFitViewClick = useCallback(() => {
    fitView({ duration: 800, padding: 0.2 })
  }, [fitView])

  // Initial fit view after nodes are loaded
  const handleInit = useCallback((reactFlowInstance: ReactFlowInstance) => {
    setTimeout(() => reactFlowInstance.fitView({ padding: 0.2 }), 100)
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
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Controls 
          showZoom={true}
          showFitView={true}
          showInteractive={true}
          position="top-right"
          className="!shadow-lg !border-2 !border-gray-200"
        />
        <MiniMap 
          nodeColor={(node: Node) => {
            const bg = node.style?.background as string
            return bg || '#94a3b8'
          }}
          maskColor="rgba(255, 255, 255, 0.2)"
          className="!bg-white !border-2 !border-gray-200 !shadow-lg"
          position="bottom-left"
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={16} 
          size={1.5} 
          color="#e2e8f0"
        />
      </ReactFlow>
      
      {/* Custom fit view button */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        <button
          onClick={handleFitViewClick}
          className="bg-white p-3 rounded-lg shadow-lg border-2 border-gray-200 hover:bg-gray-50 transition"
          title="Fit to view"
          type="button"
        >
          <Maximize2 size={20} className="text-gray-700" />
        </button>
      </div>
    </div>
  )
}

// Main Content Component
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

  const convertToFlowData = useCallback((data: { pages?: SitemapNode[] }): { nodes: Node[], edges: Edge[] } => {
    const flowNodes: Node[] = []
    const flowEdges: Edge[] = []
    let nodeId = 0
    
    const processNode = (
      node: SitemapNode, 
      parentId: string | null = null, 
      level: number = 0, 
      xOffset: number = 0, 
      yOffset: number = 0
    ): void => {
      const currentNodeId = `node-${nodeId++}`
      const nodeStyle = getNodeStyle(level)
      
      flowNodes.push({
        id: currentNodeId,
        type: 'default',
        data: { 
          label: (
            <div style={{ textAlign: 'center', userSelect: 'none' }}>
              <div style={{ fontWeight: '600', marginBottom: level === 0 ? '8px' : '2px' }}>
                {node.title || 'Untitled'}
              </div>
              {level === 0 && (
                <div style={{ fontSize: '11px', opacity: 0.95, fontWeight: '400' }}>
                  {node.url}
                </div>
              )}
            </div>
          )
        },
        position: { x: xOffset, y: yOffset },
        style: nodeStyle,
        draggable: true,
      })

      if (parentId) {
        flowEdges.push({
          id: `edge-${parentId}-${currentNodeId}`,
          source: parentId,
          target: currentNodeId,
          type: 'smoothstep',
          animated: level === 1,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#94a3b8',
            width: 20,
            height: 20,
          },
          style: { 
            stroke: '#94a3b8', 
            strokeWidth: 2.5 
          },
        })
      }

      if (node.children && node.children.length > 0) {
        const childSpacing = 320
        const totalWidth = (node.children.length - 1) * childSpacing
        const startX = xOffset - totalWidth / 2

        node.children.forEach((child, index) => {
          const childX = startX + index * childSpacing
          const childY = yOffset + 180
          processNode(child, currentNodeId, level + 1, childX, childY)
        })
      }
    }

    if (data.pages && data.pages.length > 0) {
      const pageSpacing = 450
      const totalWidth = (data.pages.length - 1) * pageSpacing
      const startX = -totalWidth / 2

      data.pages.forEach((page, index) => {
        const pageX = startX + index * pageSpacing
        processNode(page, null, 0, pageX, 0)
      })
    }

    return { nodes: flowNodes, edges: flowEdges }
  }, [])

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
        body: JSON.stringify({ url })
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
      
      if (data.warnings) {
        setWarnings(data.warnings)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError({ error: message || 'Error generating visual sitemap' })
    } finally {
      setLoading(false)
    }
  }

  const downloadAsImage = async (): Promise<void> => {
    const element = document.querySelector('.react-flow') as HTMLElement
    if (!element) {
      alert('Canvas not found. Please try again.')
      return
    }

    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(element, {
        backgroundColor: '#ffffff',
        quality: 1,
        pixelRatio: 2,
      })
      
      const link = document.createElement('a')
      link.download = 'sitemap-visual.png'
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Error downloading image:', err)
      alert('Failed to download image. Please try again.')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      generateVisual()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Visual Sitemap Builder
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Create interactive, draggable site maps in seconds
              </p>
            </div>
            
            {showCanvas && (
              <button
                onClick={downloadAsImage}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition shadow-lg font-medium"
                type="button"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Download PNG</span>
                <span className="sm:hidden">Download</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Input Section */}
        {!showCanvas && (
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 max-w-2xl mx-auto">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Enter Website URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 placeholder-gray-400 transition"
                  onKeyPress={handleKeyPress}
                />
              </div>

              <button
                onClick={generateVisual}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-semibold shadow-lg text-base sm:text-lg"
                type="button"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={22} />
                    Generating Sitemap...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Visual Sitemap
                  </>
                )}
              </button>
            </div>

            {error && error.issues && error.issues.length > 0 && (
              <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800 mb-2">Security Issues Detected</h3>
                    <p className="text-red-700 mb-2 text-sm">{error.message}</p>
                    <ul className="list-disc list-inside space-y-1">
                      {error.issues.map((issue: string, idx: number) => (
                        <li key={idx} className="text-red-700 text-sm">{issue}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {error && !error.issues && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error.error || error.message}</p>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={24} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-800 mb-2">Warnings</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {warnings.map((warning: string, idx: number) => (
                        <li key={idx} className="text-yellow-700 text-sm">{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Canvas Section */}
        {showCanvas && nodes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
            <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Interactive Sitemap Canvas</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    🖱️ Drag nodes • 🔍 Scroll to zoom • 👆 Click and drag to pan • 🔲 Click maximize for fit view
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCanvas(false)
                    setNodes([])
                    setEdges([])
                  }}
                  className="text-sm bg-white px-4 py-2 rounded-lg border-2 border-gray-200 hover:bg-gray-50 transition font-medium"
                  type="button"
                >
                  New Sitemap
                </button>
              </div>
            </div>
            
            <div className="w-full" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
              <FlowCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Main Export Component
export default function VisualSitemap() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customControlStyles }} />
      <ReactFlowProvider>
        <VisualSitemapContent />
      </ReactFlowProvider>
    </>
  )
}