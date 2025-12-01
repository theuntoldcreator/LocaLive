import { Bell, Calendar, ChevronDown, LayoutGrid, Map as MapIcon, Search, Shield, Users } from 'lucide-react';

export default function OsintTopNav() {
    return (
        <div className="h-20 px-6 flex items-center justify-between z-50 relative">
            {/* Left: Brand & Location */}
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg leading-tight tracking-wide">OSINT<span className="text-cyan-400">.AI</span></h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Intelligence Platform</p>
                    </div>
                </div>

                <div className="h-8 w-[1px] bg-slate-700/50"></div>

                <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 text-slate-200 hover:text-white transition-colors group">
                        <span className="text-sm font-medium">Los Angeles, CA</span>
                        <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    </button>

                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>Sep 23, 2024</span>
                    </div>
                </div>
            </div>

            {/* Center: Module Navigation */}
            <div className="hidden md:flex items-center gap-1 bg-[#111827]/50 p-1 rounded-xl border border-slate-800/50 backdrop-blur-sm">
                <NavButton icon={LayoutGrid} label="Dashboard" active />
                <NavButton icon={MapIcon} label="Live Map" />
                <NavButton icon={Users} label="Targets" />
                <NavButton icon={Shield} label="Threats" />
            </div>

            {/* Right: Search & Profile */}
            <div className="flex items-center gap-4">
                <div className="relative hidden lg:block">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search intelligence..."
                        className="bg-[#111827]/80 border border-slate-700/50 rounded-full pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 w-64 transition-all placeholder:text-slate-600"
                    />
                </div>

                <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0b1221]"></span>
                </button>

                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-500/30"></div>
            </div>
        </div>
    );
}

function NavButton({ icon: Icon, label, active = false }: { icon: React.ElementType, label: string, active?: boolean }) {
    return (
        <button className={`
      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
      ${active
                ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}
    `}>
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );
}
