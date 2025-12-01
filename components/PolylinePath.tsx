import { Polyline } from 'react-leaflet';

interface PolylinePathProps {
    positions: [number, number][];
}

export default function PolylinePath({ positions }: PolylinePathProps) {
    if (positions.length < 2) return null;

    return (
        <Polyline
            positions={positions}
            pathOptions={{
                color: '#000000',
                weight: 3,
                opacity: 0.8,
                lineCap: 'square',
                lineJoin: 'miter',
                dashArray: '4, 4'
            }}
        />
    );
}
