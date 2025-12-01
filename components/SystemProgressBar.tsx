'use client';

import { useEffect, useState } from 'react';

export type SystemStatus = 'idle' | 'activating' | 'searching' | 'terminating' | 'tracking';

interface SystemProgressBarProps {
    status: SystemStatus;
}

export default function SystemProgressBar({ status }: SystemProgressBarProps) {
    const [width, setWidth] = useState(0);
    const [color, setColor] = useState('bg-cyan-500');

    useEffect(() => {
        switch (status) {
            case 'idle':
                setWidth(0);
                setColor('bg-gray-600');
                break;
            case 'activating':
                // Animate 0 -> 100%
                setWidth(0);
                setTimeout(() => setWidth(100), 50); // Small delay to ensure transition triggers
                setColor('bg-cyan-500');
                break;
            case 'searching':
                setWidth(100);
                setColor('bg-cyan-500 animate-pulse');
                break;
            case 'tracking':
                setWidth(100);
                setColor('bg-green-500');
                break;
            case 'terminating':
                // Animate 100 -> 0%
                setWidth(100); // Ensure it starts at 100
                setTimeout(() => setWidth(0), 50);
                setColor('bg-red-500');
                break;
        }
    }, [status]);

    return (
        <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-900 z-50">
            <div
                className={`h-full transition-all duration-[2000ms] ease-in-out ${color}`}
                style={{ width: `${width}%` }}
            />
        </div>
    );
}
