import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, Camera, MapPin, Radio, Smartphone, Wifi } from 'lucide-react';
import Image from 'next/image';

export default function OsintTimeline() {
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        // Fetch recent location updates as "events"
        const fetchEvents = async () => {
            const { data } = await supabase
                .from('locations')
                .select(`
          *,
          sessions!inner(active)
        `)
                .eq('sessions.active', true)
                .order('updated_at', { ascending: false })
                .limit(20);

            if (data) {
                const mappedEvents = data.map((loc: any) => ({
                    id: loc.id,
                    title: 'Location Update',
                    location: `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`,
                    time: new Date(loc.updated_at).toLocaleTimeString(),
                    type: 'signal',
                    severity: loc.accuracy > 50 ? 'medium' : 'low',
                    team: 'Auto',
                    image: null
                }));
                setEvents(mappedEvents);
            }
        };

        fetchEvents();

        // Subscribe to new locations
        const channel = supabase
            .channel('osint-timeline')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'locations' }, (payload) => {
                const loc = payload.new as any;
                const newEvent = {
                    id: loc.id,
                    title: 'Live Signal',
                    location: `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`,
                    time: new Date().toLocaleTimeString(),
                    type: 'signal',
                    severity: 'low',
                    team: 'Live',
                    image: null
                };
                setEvents(prev => [newEvent, ...prev].slice(0, 50));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="w-[400px] h-full flex flex-col gap-4 p-4 overflow-hidden">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-slate-200 font-semibold tracking-wide">Live Feed</h2>
                <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                    <span className="text-xs text-cyan-400 font-mono">REALTIME</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {events.map((event) => (
                    <div key={event.id} className="glass-panel rounded-2xl p-4 hover:border-cyan-500/40 transition-colors group cursor-pointer relative overflow-hidden">
                        {/* Severity Indicator */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${event.severity === 'critical' ? 'bg-red-500' :
                            event.severity === 'high' ? 'bg-orange-500' :
                                event.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}></div>

                        <div className="flex gap-4 pl-2">
                            {/* Icon Box */}
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-[#1a2236] flex items-center justify-center border border-slate-700/50 group-hover:border-cyan-500/30 transition-colors">
                                    {event.type === 'camera' && <Camera className="w-5 h-5 text-cyan-400" />}
                                    {event.type === 'signal' && <Wifi className="w-5 h-5 text-purple-400" />}
                                    {event.type === 'social' && <Smartphone className="w-5 h-5 text-pink-400" />}
                                    {event.type === 'iot' && <Radio className="w-5 h-5 text-emerald-400" />}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-slate-200 font-medium text-sm truncate pr-2">{event.title}</h3>
                                    <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">{event.time}</span>
                                </div>

                                <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{event.location}</span>
                                </div>

                                {event.image && (
                                    <div className="mb-3 rounded-lg overflow-hidden h-24 relative">
                                        <Image src={event.image} alt="Evidence" fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-400 uppercase tracking-wider">
                                            {event.team}
                                        </span>
                                        {event.severity === 'critical' && (
                                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 uppercase tracking-wider flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" /> CRITICAL
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
