'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import OsintIntelPanel from '@/components/osint/OsintIntelPanel';
import OsintMapOverlay from '@/components/osint/OsintMapOverlay';
import DashboardHeader from '@/components/DashboardHeader';

// Dynamic import for Map
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#0b1221]" />
});

import SystemProgressBar, { SystemStatus } from '@/components/SystemProgressBar';

export default function Home() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [path, setPath] = useState<[number, number][]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('idle');

  // Track timeout to cancel it if a new session starts immediately (Rotation vs Termination)
  const terminationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Find Active Session & Subscribe to New Sessions
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
        setSystemStatus('searching'); // Assume searching if loading existing session
      }
    };

    fetchActiveSession();

    // Subscribe to NEW sessions (Instant Trap Detection)
    const sessionChannel = supabase
      .channel('osint-sessions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sessions' }, (payload) => {
        const newSession = payload.new as any;
        if (newSession.active) {
          // Cancel any pending termination reload (User is rotating keys, not quitting)
          if (terminationTimeoutRef.current) {
            clearTimeout(terminationTimeoutRef.current);
            terminationTimeoutRef.current = null;
          }

          // ACTIVATING TRANSITION
          setSystemStatus('activating');
          setTimeout(() => {
            setActiveSessionId(newSession.id);
            setLocation(null);
            setPath([]);
            setSystemStatus('searching');
          }, 2000); // Wait for animation
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions' }, (payload) => {
        const updatedSession = payload.new as any;
        if (!updatedSession.active && updatedSession.id === activeSessionId) {
          // TERMINATING TRANSITION
          setSystemStatus('terminating');
          setActiveSessionId(null); // Immediately detach session
          setLocation(null); // Immediately clear map data
          setPath([]);

          terminationTimeoutRef.current = setTimeout(() => {
            window.location.reload(); // Hard reset
          }, 2000); // Wait for animation
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      if (terminationTimeoutRef.current) clearTimeout(terminationTimeoutRef.current);
    };
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
        setSystemStatus('tracking');
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
        setSystemStatus('tracking');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSessionId]);

  // Safety Net: Ensure status is 'tracking' if we have a location
  useEffect(() => {
    if (location && systemStatus === 'searching') {
      setSystemStatus('tracking');
    }
  }, [location, systemStatus]);

  // Determine overlay state based on systemStatus
  // We use systemStatus for the overlay logic now to match animations
  const showSearchingOverlay = systemStatus === 'searching' || systemStatus === 'activating';
  const showIdleOverlay = systemStatus === 'idle' || systemStatus === 'terminating';

  return (
    <div className="flex flex-col h-screen w-full bg-[#0b1221] overflow-hidden font-sans text-slate-200">
      {/* New Dashboard Header */}
      <DashboardHeader location={location} />

      <div className="flex-1 flex overflow-hidden relative z-10">

        {/* Unified Intelligence Panel (Sidebar) */}
        <div className="flex-shrink-0 h-full">
          <OsintIntelPanel />
        </div>

        {/* Main Content Area with Rounded Map */}
        <div className="flex-1 relative bg-[#f3f4f6] p-4 rounded-tl-3xl overflow-hidden">
          {/* Inner Map Container with Rounded Corners */}
          <div className="absolute inset-8 rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-white z-0">
            <Map
              lat={location?.lat || 0}
              lng={location?.lng || 0}
              heading={heading || 0}
              accuracy={location?.accuracy || 100}
              path={path}
              isFollowing={!!location}
              className="w-full h-full"
              showMarker={!!location && systemStatus === 'tracking'}
            />
          </div>

          {/* System Status Overlay */}
          {(showSearchingOverlay || showIdleOverlay) && (
            <div className="absolute inset-4 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl transition-all duration-500">
              <div className="flex flex-col items-center gap-6 p-8 rounded-2xl border border-gray-200 bg-white shadow-2xl max-w-md text-center">

                {showSearchingOverlay ? (
                  // SEARCHING / ACTIVATING STATE
                  <>
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 tracking-wide mb-2">
                        {systemStatus === 'activating' ? 'INITIALIZING TRAP...' : 'WAITING FOR TARGET CONNECTION'}
                      </h2>
                      <p className="text-sm text-gray-500 font-mono">
                        {systemStatus === 'activating' ? 'Generating secure uplink...' : 'Trap link active. Waiting for target to verify...'}
                      </p>
                    </div>
                    {activeSessionId && (
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 w-full">
                        <p className="text-[10px] text-gray-400 uppercase mb-1">Session ID</p>
                        <code className="text-xs text-cyan-600 font-mono">{activeSessionId}</code>
                      </div>
                    )}
                  </>
                ) : (
                  // IDLE / TERMINATING STATE
                  <>
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      <div className={`w-3 h-3 bg-gray-400 rounded-full ${systemStatus === 'terminating' ? '' : 'animate-pulse'}`}></div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 tracking-wide mb-2">
                        {systemStatus === 'terminating' ? 'TERMINATING LINK...' : 'SYSTEM STANDBY'}
                      </h2>
                      <p className="text-sm text-gray-500 font-mono">
                        {systemStatus === 'terminating' ? 'Severing connection and scrubbing data...' : 'Ready to initialize intelligence gathering.'}
                      </p>
                    </div>
                    {systemStatus === 'idle' && (
                      <div className="text-xs text-gray-400 bg-gray-50 px-4 py-2 rounded-full">
                        Generate a Trap Link in the sidebar to begin.
                      </div>
                    )}
                  </>
                )}

              </div>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Progress Bar */}
      <SystemProgressBar status={systemStatus} />
    </div>
  );
}
