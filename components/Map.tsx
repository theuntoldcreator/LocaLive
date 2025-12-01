'use client';

import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { createUserMarkerIcon } from './MarkerIcon';
import AccuracyCircle from './AccuracyCircle';
import PolylinePath from './PolylinePath';

interface MapProps {
    lat: number;
    lng: number;
    heading?: number | null;
    accuracy?: number;
    path?: [number, number][];
    isFollowing: boolean;
    onDragStart?: () => void;
    className?: string;
    showMarker?: boolean;
}

// ... (MapController and SmoothMarker remain unchanged)

// Component to handle map movements and events
function MapController({
    lat,
    lng,
    isFollowing,
    showMarker,
    onDragStart
}: {
    lat: number;
    lng: number;
    isFollowing: boolean;
    showMarker: boolean;
    onDragStart?: () => void;
}) {
    const map = useMap();
    const isFirstLoad = useRef(true);

    useMapEvents({
        dragstart: () => {
            onDragStart?.();
        },
    });

    useEffect(() => {
        if (showMarker && isFollowing) {
            // Target Found: Fly to location
            map.flyTo([lat, lng], 17, {
                animate: true,
                duration: 4.5, // 4-5 seconds as requested
                easeLinearity: 0.2,
            });
        } else if (!showMarker) {
            // Idle / Waiting: Fly to World View
            map.flyTo([20, 0], 2, {
                animate: true,
                duration: 2.5,
            });
        }
    }, [lat, lng, isFollowing, showMarker, map]);

    return null;
}

// Component to handle smooth marker interpolation
function SmoothMarker({
    lat,
    lng,
    heading
}: {
    lat: number;
    lng: number;
    heading: number | null
}) {
    const markerRef = useRef<L.Marker>(null);
    const reqId = useRef<number>();
    const startTime = useRef<number>();
    const startPos = useRef<L.LatLngTuple>([lat, lng]);
    const targetPos = useRef<L.LatLngTuple>([lat, lng]);

    useEffect(() => {
        // When target changes, start animation
        if (markerRef.current) {
            const current = markerRef.current.getLatLng();
            startPos.current = [current.lat, current.lng];
            targetPos.current = [lat, lng];
            startTime.current = performance.now();

            const animate = (time: number) => {
                if (!startTime.current) return;
                const elapsed = time - startTime.current;
                const duration = 1000; // Interpolate over 1 second (matches update interval roughly)
                const t = Math.min(elapsed / duration, 1);

                // Linear interpolation
                const currentLat = startPos.current[0] + (targetPos.current[0] - startPos.current[0]) * t;
                const currentLng = startPos.current[1] + (targetPos.current[1] - startPos.current[1]) * t;

                if (markerRef.current) {
                    markerRef.current.setLatLng([currentLat, currentLng]);

                    // Update icon rotation
                    const icon = createUserMarkerIcon(heading);
                    markerRef.current.setIcon(icon);
                }

                if (t < 1) {
                    reqId.current = requestAnimationFrame(animate);
                }
            };

            reqId.current = requestAnimationFrame(animate);
        }

        return () => {
            if (reqId.current) cancelAnimationFrame(reqId.current);
        };
    }, [lat, lng, heading]);

    return (
        <Marker
            ref={markerRef}
            position={[lat, lng]}
            icon={createUserMarkerIcon(heading)}
            zIndexOffset={1000} // Keep on top
        />
    );
}

import OsintMapOverlay from './osint/OsintMapOverlay';

// ... existing imports ...

// Component to handle map controls
function MapControlWrapper({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();

    return (
        <OsintMapOverlay
            onZoomIn={() => map.zoomIn()}
            onZoomOut={() => map.zoomOut()}
            onLocate={() => map.flyTo([lat, lng], 17, { animate: true, duration: 1.5 })}
        />
    );
}

// ... existing components ...

const MapComponent = ({
    lat,
    lng,
    heading = null,
    accuracy = 0,
    path = [],
    isFollowing,
    onDragStart,
    className,
    showMarker = true
}: MapProps) => {
    const mapRef = useRef<L.Map | null>(null);

    return (
        <div className={`w-full h-full relative ${className}`}>
            <MapContainer
                center={[20, 0]} // Default center
                zoom={2} // Default zoom
                style={{ height: '100%', width: '100%', background: '#e5e7eb' }}
                zoomControl={false}
                ref={mapRef}
            >
                {/* Standard Colored Map (OpenStreetMap) */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {showMarker && (
                    <>
                        <SmoothMarker lat={lat} lng={lng} heading={heading} />
                        {accuracy > 0 && (
                            <AccuracyCircle lat={lat} lng={lng} accuracy={accuracy} />
                        )}
                        <PolylinePath positions={path} />
                    </>
                )}

                <MapController
                    lat={lat}
                    lng={lng}
                    isFollowing={isFollowing}
                    showMarker={showMarker}
                    onDragStart={onDragStart}
                />

                <MapControlWrapper lat={lat} lng={lng} />
            </MapContainer>
        </div>
    );
}

export default MapComponent;
