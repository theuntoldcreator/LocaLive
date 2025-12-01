'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import OsintSidebar from '@/components/OsintSidebar';
import OsintTopNav from '@/components/osint/OsintTopNav';
import OsintTimeline from '@/components/osint/OsintTimeline';
import OsintMapOverlay from '@/components/osint/OsintMapOverlay';

// Dynamic import for Map
const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#0b1221]" />
});

export default function OsintPage() {
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
    const [heading, setHeading] = useState<number | null>(null);
    const [path, setPath] = useState<[number, number][]>([]);

    // 1. Find Active Session
    useEffect(() => {
        const fetchActiveSession = async () => {
            const { data } = await supabase
                .from('sessions')
                .select('id')
                .eq('active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data) {
                setActiveSessionId(data.id);
            }
        };

        fetchActiveSession();
        // Poll for new sessions every 10s if none found
        const interval = setInterval(() => {
            if (!activeSessionId) fetchActiveSession();
        }, 10000);
        return () => clearInterval(interval);
    }, [activeSessionId]);

    // 2. Subscribe to Location Updates
    useEffect(() => {
        if (!activeSessionId) return;

        // Fetch initial location
        const fetchInitial = async () => {
            const { data } = await supabase
                .from('locations')
                .select('*')
                .eq('session_id', activeSessionId)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

            if (data) {
                setLocation({ lat: data.lat, lng: data.lng, accuracy: data.accuracy || 0 });
                setHeading(data.heading);
                setPath(prev => [...prev, [data.lat, data.lng]]);
            }
        };
        fetchInitial();

        // Realtime subscription
        const channel = supabase
            .channel(`osint-map-${activeSessionId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'locations',
                filter: `session_id=eq.${activeSessionId}`
            }, (payload) => {
                const newLoc = payload.new as any;
                setLocation({ lat: newLoc.lat, lng: newLoc.lng, accuracy: newLoc.accuracy || 0 });
                setHeading(newLoc.heading);
                setPath(prev => [...prev, [newLoc.lat, newLoc.lng]]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeSessionId]);

    return (
        <div className="flex flex-col h-screen w-full bg-[#0b1221] overflow-hidden font-sans text-slate-200">
            {/* Background Map Layer */}
            <div className="absolute inset-0 z-0 opacity-40">
                <Map
                    lat={location?.lat || 34.0522}
                    lng={location?.lng || -118.2437}
                    heading={heading || 0}
                    accuracy={location?.accuracy || 100}
                    path={path}
                    isFollowing={!!location}
                />
                {/* Dark Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0b1221] via-[#0b1221]/80 to-transparent pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#0b1221] via-transparent to-[#0b1221] pointer-events-none"></div>
            </div>

            <OsintTopNav />

            <div className="flex-1 flex overflow-hidden relative z-10 px-6 pb-6 gap-6">

                {/* Far Left: Target Profile Sidebar */}
                <div className="glass-panel rounded-[20px] overflow-hidden w-64 flex-shrink-0">
                    <OsintSidebar />
                </div>

                {/* Left Panel: Timeline */}
                <div className="glass-panel rounded-[20px] overflow-hidden flex flex-col w-[400px] flex-shrink-0">
                    <OsintTimeline />
                </div>

                {/* Center/Right Panel: Map View Area */}
                <div className="flex-1 glass-panel rounded-[20px] relative overflow-hidden border border-slate-700/30 shadow-2xl shadow-black/50">
                    {/* Inner Map (High Visibility) */}
                    <div className="absolute inset-0 z-0">
                        <Map
                            lat={location?.lat || 34.0522}
                            lng={location?.lng || -118.2437}
                            heading={heading || 0}
                            accuracy={location?.accuracy || 100}
                            path={path}
                            isFollowing={!!location}
                        />
                        {/* Map Theme Override Class applied in globals.css via .osint-map if needed, 
                 but here we rely on the Map component. 
                 To force the specific OSINT look, we might need to pass a prop or wrap it.
                 For now, we use the global CSS override on the container if we add a class.
             */}
                        <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-blue-900/20"></div>
                    </div>

                    <OsintMapOverlay />
                </div>

            </div>
        </div>
    );
}
