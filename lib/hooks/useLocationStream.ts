import { useState, useEffect, useRef } from 'react';

export interface LocationData {
    lat: number;
    lng: number;
    accuracy: number;
    speed: number | null;
    timestamp: number;
}

export function useLocationStream(active: boolean = true) {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const watchId = useRef<number | null>(null);

    useEffect(() => {
        if (!active || !('geolocation' in navigator)) {
            return;
        }

        const options: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        };

        const handleSuccess = (pos: GeolocationPosition) => {
            setLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                speed: pos.coords.speed,
                timestamp: pos.timestamp,
            });
            setError(null);
        };

        const handleError = (err: GeolocationPositionError) => {
            setError(err.message);
        };

        watchId.current = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            options
        );

        return () => {
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
            }
        };
    }, [active]);

    return { location, error };
}
