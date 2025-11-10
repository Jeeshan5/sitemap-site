// frontend/components/shared/MetadataPanel.tsx
import React from 'react';
import { X, RefreshCw, Trash2, ArrowUpRight } from 'lucide-react';

// Re-defining the SitemapNode interface for type safety in this component
interface SitemapNode {
    url: string
    title?: string
    level?: number
    children?: SitemapNode[]
    status: number 
    isNoIndex: boolean 
    isRedirect: boolean 
    inboundLinks: number 
    trafficScore?: number 
    isCollapsed?: boolean 
    wordCount?: number;
    metaTags?: Record<string, string>;
}

interface MetadataPanelProps {
    nodeData: SitemapNode | null;
    onClose: () => void;
    theme: 'light' | 'dark';
    // Add action handlers as props here:
    // onReCrawl?: (url: string) => void;
    // onRemove?: (url: string) => void;
}

const MetadataPanel: React.FC<MetadataPanelProps> = ({ nodeData, onClose, theme }) => {
    // TEST LOGGING: Log when MetadataPanel opens
    React.useEffect(() => {
        if (nodeData) {
            console.log('📊 MetadataPanel opened for node:', {
                url: nodeData.url,
                title: nodeData.title,
                status: nodeData.status,
                inboundLinks: nodeData.inboundLinks,
                level: nodeData.level,
                isNoIndex: nodeData.isNoIndex,
                isRedirect: nodeData.isRedirect,
                metaTags: nodeData.metaTags,
            });
        }
    }, [nodeData]);

    if (!nodeData) return null;
    
    const panelClasses = theme === 'dark' 
        ? 'bg-slate-900 text-white border-l border-slate-700' 
        : 'bg-white text-slate-900 border-l border-slate-200';

    const getStatusColor = (status: number) => {
        if (status >= 400) return 'text-red-500 bg-red-100 dark:bg-red-900/50 p-1 rounded-sm';
        if (status >= 300) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50 p-1 rounded-sm';
        return 'text-green-600 bg-green-100 dark:bg-green-900/50 p-1 rounded-sm';
    };

    return (
        <div 
            className={`fixed right-0 top-0 h-full w-96 max-w-[90vw] shadow-2xl z-[200] transition-transform duration-300 transform translate-x-0 ${panelClasses}`}
            style={{ width: 'min(400px, 90vw)' }}
        >
            <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                <h3 className="text-xl font-bold truncate">{nodeData.title || 'Untitled Page'}</h3>
                <button 
                    onClick={onClose} 
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                    aria-label="Close metadata panel"
                >
                    <X size={20} />
                </button>
            </div>
            
            <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
                <h4 className="text-sm font-semibold mb-2 text-indigo-500">URL & Status</h4>
                <div className="mb-4 text-sm break-all">
                    <p className="font-mono text-xs mb-1 text-slate-400">
                        {nodeData.url}
                    </p>
                    <p className="flex items-center gap-2">
                        <strong>Status:</strong> 
                        <span className={`font-semibold text-xs ${getStatusColor(nodeData.status)}`}>
                            {nodeData.status} 
                            {nodeData.isRedirect && <span className="ml-1 text-xs font-normal">(Redirect)</span>}
                        </span>
                        
                        {nodeData.isNoIndex && (
                            <span className="text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50 p-1 rounded-sm text-xs font-semibold">
                                NOINDEX
                            </span>
                        )}
                    </p>
                </div>

                <h4 className="text-sm font-semibold mb-2 text-indigo-500">Importance Metrics</h4>
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <p><strong>Level/Depth:</strong> {nodeData.level}</p>
                    <p><strong>Inbound Links:</strong> {nodeData.inboundLinks || 0}</p>
                    <p><strong>Traffic Score:</strong> {nodeData.trafficScore || 'N/A'}</p>
                    <p><strong>Word Count:</strong> {nodeData.wordCount || 'N/A'}</p>
                </div>

                <h4 className="text-sm font-semibold mb-2 text-indigo-500">Meta Tags (Excerpt)</h4>
                <div className="text-xs bg-slate-50 dark:bg-slate-800 p-3 rounded-lg max-h-40 overflow-auto">
                    {nodeData.metaTags ? (
                        Object.entries(nodeData.metaTags).map(([key, value]) => (
                            <p key={key} className="mb-1">
                                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{key}:</span> {value}
                            </p>
                        ))
                    ) : (
                        <p className="text-slate-500">No meta tag data available.</p>
                    )}
                </div>


                <div className="mt-6 border-t pt-4 border-slate-200 dark:border-slate-700 space-y-2">
                    <a 
                        href={nodeData.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full bg-indigo-600 text-white p-2 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition font-medium"
                    >
                        <ArrowUpRight size={16} /> Open Page
                    </a>
                    {/* Placeholder for user actions: Re-crawl, Remove */}
                    <button className="w-full bg-slate-100 text-slate-700 p-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 transition">
                        <RefreshCw size={16} /> Re-crawl Page
                    </button>
                    <button className="w-full bg-red-100 text-red-600 p-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 transition">
                        <Trash2 size={16} /> Remove Node
                    </button>
                </div>

            </div>
        </div>
    );
};

export default MetadataPanel;