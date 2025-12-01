import { Battery, Cloud, Compass, Gauge, Globe, MapPin, Signal, Wind } from 'lucide-react';

interface TacticalDashboardProps {
    location: {
        lat: number;
        lng: number;
        speed: number | null;
        accuracy: number;
        altitude?: number | null;
    } | null;
    heading: number | null;
    weather: {
        temperature: number;
        windSpeed: number;
        windDirection: number;
        weatherCode: number;
    } | null;
    status: string;
    shareUrl?: string;
    onShare?: () => void;
    onStop?: () => void;
    isSharing?: boolean;
}

export default function TacticalDashboard({
    location,
    heading,
    weather,
    status,
    shareUrl,
    onShare,
    onStop,
    isSharing = false
}: TacticalDashboardProps) {
    return (
        <div className="bg-black border border-white p-4 w-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status === 'LIVE' ? 'bg-white animate-pulse' : 'bg-gray-600'}`}></div>
                    <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-white">
                        {status} FEED // {isSharing ? 'TRANSMITTING' : 'STANDBY'}
                    </h2>
                </div>
                {isSharing && onStop && (
                    <button
                        onClick={onStop}
                        className="bg-white text-black text-[10px] font-bold px-2 py-1 hover:bg-gray-200 uppercase"
                    >
                        Terminate Uplink
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                {/* Telemetry Block */}
                <div className="col-span-2 border border-gray-800 p-2 relative">
                    <span className="absolute top-0 right-1 text-[8px] text-gray-500 uppercase">Telemetry</span>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-gray-400" />
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase">Velocity</p>
                                <p className="font-mono font-bold text-white">
                                    {location?.speed ? (location.speed * 3.6).toFixed(1) : '0.0'} <span className="text-[10px] text-gray-500">KM/H</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Compass className="w-4 h-4 text-gray-400" />
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase">Heading</p>
                                <p className="font-mono font-bold text-white">
                                    {heading ? heading.toFixed(0) : '---'}°
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Environment Block */}
                <div className="col-span-2 border border-gray-800 p-2 relative">
                    <span className="absolute top-0 right-1 text-[8px] text-gray-500 uppercase">Environment</span>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="flex items-center gap-2">
                            <Cloud className="w-4 h-4 text-gray-400" />
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase">Temp</p>
                                <p className="font-mono font-bold text-white">
                                    {weather ? weather.temperature : '--'}°C
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Wind className="w-4 h-4 text-gray-400" />
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase">Wind</p>
                                <p className="font-mono font-bold text-white">
                                    {weather ? weather.windSpeed : '--'} <span className="text-[10px] text-gray-500">KM/H</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coordinates Block */}
                <div className="col-span-2 md:col-span-3 border border-gray-800 p-2 relative">
                    <span className="absolute top-0 right-1 text-[8px] text-gray-500 uppercase">Geo-Location</span>
                    <div className="flex items-center gap-3 mt-1">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <div className="font-mono text-xs text-white tracking-wider flex-1">
                            LAT: {location?.lat.toFixed(6) || '00.000000'} <br />
                            LNG: {location?.lng.toFixed(6) || '00.000000'}
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-500 uppercase">Precision</p>
                            <p className="font-mono font-bold text-white">±{Math.round(location?.accuracy || 0)}M</p>
                        </div>
                    </div>
                </div>

                {/* Status Block */}
                <div className="col-span-2 md:col-span-1 border border-gray-800 p-2 relative flex flex-col justify-center">
                    <span className="absolute top-0 right-1 text-[8px] text-gray-500 uppercase">System</span>
                    <div className="flex justify-between items-center mt-1">
                        <div className="flex items-center gap-1">
                            <Battery className="w-3 h-3 text-white" />
                            <span className="text-xs font-mono">100%</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Signal className="w-3 h-3 text-white" />
                            <span className="text-xs font-mono">OK</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Share Link */}
            {isSharing && shareUrl && (
                <div className="mt-4 flex gap-2">
                    <input
                        readOnly
                        value={shareUrl}
                        className="flex-1 bg-gray-900 border border-gray-700 text-xs text-gray-300 font-mono p-2 outline-none"
                    />
                    <button
                        onClick={onShare}
                        className="bg-white text-black text-xs font-bold px-4 hover:bg-gray-200 uppercase"
                    >
                        Copy Uplink
                    </button>
                </div>
            )}
        </div>
    );
}
