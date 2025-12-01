'use client';

import { useState, useEffect } from 'react';
import { Cloud, MapPin, Calendar, Bell, Search, User } from 'lucide-react';
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
        <div className="h-16 bg-[#0b1221] border-b border-gray-800 flex items-center justify-between px-6 z-20 flex-shrink-0">
            {/* Left: Location & Environment (Branding Removed) */}
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-4 h-4 text-cyan-500" />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white leading-none">{city}</span>
                            <span className="text-[10px] text-gray-500 leading-none mt-1">
                                {location ? `${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° W` : 'WAITING FOR TARGET...'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4 text-cyan-500" />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white leading-none">{date}</span>
                            <span className="text-[10px] text-gray-500 leading-none mt-1">{time}</span>
                        </div>
                    </div>

                    {weather && (
                        <div className="flex items-center gap-2 text-gray-300">
                            <Cloud className="w-4 h-4 text-cyan-500" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white leading-none">{weather.temperature}°C</span>
                                <span className="text-[10px] text-gray-500 leading-none mt-1">Wind: {weather.windSpeed} km/h</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Search & Profile */}
            <div className="flex items-center gap-6">
                <div className="relative">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search intelligence..."
                        className="bg-[#1a1d29] border border-gray-800 rounded-full py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-cyan-500/50 w-64 transition-all"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button className="relative text-gray-400 hover:text-white transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0b1221]" />
                    </button>
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center border border-gray-600">
                        <User className="w-4 h-4 text-gray-300" />
                    </div>
                </div>
            </div>
        </div>
    );
}
