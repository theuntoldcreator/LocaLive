import { Circle } from 'react-leaflet';

interface AccuracyCircleProps {
    lat: number;
    lng: number;
    accuracy: number;
}

export default function AccuracyCircle({ lat, lng, accuracy }: AccuracyCircleProps) {
    return (
        <Circle
            center={[lat, lng]}
            radius={accuracy}
            pathOptions={{
                color: '#000000',
                fillColor: '#000000',
                fillOpacity: 0.05,
                weight: 1,
                opacity: 0.3,
            }}
        />
    );
}
