'use client';

import { useState, useEffect } from 'react';
import { Cloud, MapPin, Calendar, Globe } from 'lucide-react';
import { useWeather } from '@/lib/hooks/useWeather';

interface DashboardHeaderProps {
    location?: { lat: number; lng: number } | null;
}

export default function DashboardHeader({ location }: DashboardHeaderProps) {
    const [time, setTime] = useState<string>('');
    const [date, setDate] = useState<string>('');
    const [city, setCity] = useState<string>('System Standby');

    // Use provided location or default to null (which useWeather handles)
    const weather = useWeather(location?.lat, location?.lng);

    useEffect(() => {
        if (location) {
            // Simple reverse geocoding
            fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.lat}&longitude=${location.lng}&localityLanguage=en`)
                .then(res => res.json())
                .then(data => {
                    setCity(`${data.city || data.locality || 'Unknown'}, ${data.principalSubdivisionCode || data.countryCode}`);
                })
                .catch(() => setCity('Unknown Location'));
        } else {
            setCity('System Standby');
        }
    }, [location]);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setDate(now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-16 bg-[#0b1221] border-b border-gray-800 flex items-center justify-between px-4 md:px-6 z-20 flex-shrink-0">
            {/* Left: Branding */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-white font-bold text-sm tracking-wide">LocaLive</h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Intelligence Platform</p>
                </div>
            </div>

            {/* Right: Location & Environment */}
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-4 h-4 text-cyan-500" />
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-white leading-none">{city}</span>
                            <span className="text-[10px] text-gray-500 leading-none mt-1">
                                {location ? `${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° W` : 'WAITING FOR TARGET...'}
                            </span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4 text-cyan-500" />
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-white leading-none">{date}</span>
                            <span className="text-[10px] text-gray-500 leading-none mt-1">{time}</span>
                        </div>
                    </div>

                    {weather && (
                        <div className="hidden md:flex items-center gap-2 text-gray-300">
                            <Cloud className="w-4 h-4 text-cyan-500" />
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-white leading-none">{weather.temperature}°C</span>
                                <span className="text-[10px] text-gray-500 leading-none mt-1">Wind: {weather.windSpeed} km/h</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
