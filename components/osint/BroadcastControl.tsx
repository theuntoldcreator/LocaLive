'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getFingerprint } from '@/lib/fingerprint';
import { useLocationStream } from '@/lib/hooks/useLocationStream';
import { useOrientation } from '@/lib/hooks/useOrientation';
import { Play, Square } from 'lucide-react';

export default function BroadcastControl() {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [broadcastLocation, setBroadcastLocation] = useState(false);
    const [hasSentFingerprint, setHasSentFingerprint] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Custom Hooks
    const { location, error: locationError } = useLocationStream(isActive && broadcastLocation);
    const heading = useOrientation();

    // Effects
    useEffect(() => {
        if (locationError) setError(locationError);
    }, [locationError]);

    // Sync with existing active session on mount
    useEffect(() => {
        const checkActiveSession = async () => {
            const { data } = await supabase
                .from('sessions')
                .select('id')
                .eq('active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data) {
                setSessionId(data.id);
                setIsActive(true);
            }
        };
        checkActiveSession();
    }, []);

    useEffect(() => {
        if (isActive && broadcastLocation && location && sessionId) {
            // Send fingerprint only once
            if (!hasSentFingerprint) {
                getFingerprint().then(fp => {
                    sendLocationUpdate(sessionId, location, heading, fp);
                    setHasSentFingerprint(true);
                });
            } else {
                sendLocationUpdate(sessionId, location, heading);
            }
        }
    }, [location, isActive, broadcastLocation, sessionId, heading, hasSentFingerprint]);

    const startTrap = async () => {
        setError(null);
        try {
            // 1. Deactivate ALL existing active sessions to ensure singleton behavior
            await supabase.from('sessions').update({ active: false }).eq('active', true);

            // 2. Create new session
            const { data, error: sessionError } = await supabase
                .from('sessions')
                .insert([{ active: true }])
                .select()
                .single();

            if (sessionError) throw sessionError;
            if (!data) throw new Error('Failed to create session');

            setSessionId(data.id);
            setIsActive(true);
            setHasSentFingerprint(false);
        } catch (err: unknown) {
            console.error('Trap Error:', err);
            let message = 'Unknown error';
            if (err instanceof Error) {
                message = err.message;
            } else if (typeof err === 'object' && err !== null && 'message' in err) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                message = (err as any).message;
            } else if (typeof err === 'object' && err !== null && 'error_description' in err) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                message = (err as any).error_description;
            } else {
                message = JSON.stringify(err);
            }
            setError(message);
            setIsActive(false);
        }
    };

    const stopTrap = async () => {
        if (sessionId) {
            await supabase.from('sessions').update({ active: false }).eq('id', sessionId);
        }
        setIsActive(false);
        setSessionId(null);
        setBroadcastLocation(false); // Reset permission/decoy state
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sendLocationUpdate = async (sid: string, loc: any, head: number | null, fp?: any) => {
        try {
            await fetch('/api/update-location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sid,
                    lat: loc.lat,
                    lng: loc.lng,
                    heading: head,
                    accuracy: loc.accuracy,
                    fingerprint: fp
                }),
            });
        } catch (e) {
            console.error('Failed to send update', e);
        }
    };

    return (
        <div className="px-4 w-full">
            <div className="bg-[#1a1d29] p-4 rounded-xl border border-gray-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Trap Generator</h3>
                    {isActive && <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] text-red-500 font-mono">ACTIVE</span>
                    </div>}
                </div>

                {error && (
                    <div className="text-[10px] text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                        {error}
                    </div>
                )}

                {!isActive ? (
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${broadcastLocation ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600 group-hover:border-gray-500'}`}>
                                {broadcastLocation && <div className="w-2 h-2 bg-white rounded-sm" />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={broadcastLocation}
                                onChange={(e) => setBroadcastLocation(e.target.checked)}
                            />
                            <span className="text-[10px] text-gray-400 group-hover:text-gray-300">Broadcast My Location (Decoy)</span>
                        </label>

                        <button
                            onClick={startTrap}
                            className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(8,145,178,0.4)]"
                        >
                            <Play className="w-3 h-3 fill-current" />
                            GENERATE TRAP LINK
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {broadcastLocation && (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-black/40 p-2 rounded border border-gray-700">
                                    <p className="text-[10px] text-gray-500">DECOY LAT</p>
                                    <p className="text-xs font-mono text-cyan-400">{location?.lat.toFixed(4) || '...'}</p>
                                </div>
                                <div className="bg-black/40 p-2 rounded border border-gray-700">
                                    <p className="text-[10px] text-gray-500">DECOY LNG</p>
                                    <p className="text-xs font-mono text-cyan-400">{location?.lng.toFixed(4) || '...'}</p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={stopTrap}
                            className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/50 py-2 rounded-lg text-xs font-bold transition-all"
                        >
                            <Square className="w-3 h-3 fill-current" />
                            TERMINATE TRAP
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
