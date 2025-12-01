import { useState, useEffect } from 'react';

export function useOrientation() {
    const [heading, setHeading] = useState<number | null>(null);

    useEffect(() => {
        const handleOrientation = (event: DeviceOrientationEvent) => {
            let newHeading: number | null = null;

            // iOS
            if ((event as any).webkitCompassHeading) {
                newHeading = (event as any).webkitCompassHeading;
            }
            // Android / Standard
            else if (event.alpha !== null) {
                // alpha is 0 at North? Not always consistent across browsers, 
                // but typically 0 is North for absolute orientation.
                // We might need to adjust based on absolute property.
                newHeading = 360 - event.alpha;
            }

            if (newHeading !== null) {
                setHeading(newHeading);
            }
        };

        // Request permission for iOS 13+
        const requestPermission = async () => {
            if (
                typeof DeviceOrientationEvent !== 'undefined' &&
                (DeviceOrientationEvent as any).requestPermission
            ) {
                try {
                    const response = await (DeviceOrientationEvent as any).requestPermission();
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
                    }
                } catch (e) {
                    console.error('Orientation permission error', e);
                }
            } else {
                window.addEventListener('deviceorientation', handleOrientation);
            }
        };

        requestPermission();

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, []);

    return heading;
}
