import { Filter, Layers, Locate, Minus, Plus } from 'lucide-react';

interface OsintMapOverlayProps {
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onLocate?: () => void;
}

export default function OsintMapOverlay({ onZoomIn, onZoomOut, onLocate }: OsintMapOverlayProps) {
    return (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-[1000]">
            {/* Top Right: Filters */}
            <div className="flex justify-end gap-3 pointer-events-auto">
                <button className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filters</span>
                </button>
                <button className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all">
                    <Layers className="w-4 h-4" />
                    <span className="text-sm font-medium">Layers</span>
                </button>
            </div>

            {/* Bottom Right: Zoom Controls */}
            <div className="flex justify-end pointer-events-auto">
                <div className="glass-panel p-1 rounded-xl flex flex-col gap-1">
                    <button
                        onClick={onZoomIn}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    <div className="h-[1px] bg-slate-700/50 mx-2"></div>
                    <button
                        onClick={onZoomOut}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                        <Minus className="w-5 h-5" />
                    </button>
                    <div className="h-[1px] bg-slate-700/50 mx-2"></div>
                    <button
                        onClick={onLocate}
                        className="p-2 text-cyan-400 bg-cyan-500/10 rounded-lg transition-colors"
                    >
                        <Locate className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
